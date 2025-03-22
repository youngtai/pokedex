import asyncio
import base64
import json
import logging
import os
import re
from contextlib import AsyncExitStack
from functools import partial
from typing import Annotated, Any, Dict, Optional

import uvicorn
from anthropic import Anthropic
from dotenv import load_dotenv
from groq import Groq
from litestar import Litestar, MediaType, post
from litestar.datastructures import UploadFile
from litestar.enums import RequestEncodingType
from litestar.params import Body
from litestar.response import Response
from litestar.static_files import create_static_files_router
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from openai import OpenAI

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pokeapi-web-server")


class MCPClient:
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.openai = OpenAI()
        self.anthropic = Anthropic()
        self.groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

    async def get_session(self):
        if self.session is None:
            await self.initialize_session()
        return self.session

    async def initialize_session(self):
        server_params = StdioServerParameters(
            command="python",
            args=["-m", "backend.mcp_server.app.pokeapi_mcp_server"],
            env=None,
        )

        self.stdio, self.write = await self.exit_stack.enter_async_context(
            stdio_client(server_params)
        )
        self.session = await self.exit_stack.enter_async_context(
            ClientSession(self.stdio, self.write)
        )

        await self.session.initialize()

        tools = await self.session.list_tools()
        logger.info(
            f"Connected to server with tools: {', '.join([tool.name for tool in tools.tools])}"
        )
        resources = await self.session.list_resources()
        logger.info(
            f"Connected to server with resources: {', '.join([resource.name for resource in resources.resources])}"
        )

    async def cleanup(self):
        if self.exit_stack:
            await self.exit_stack.aclose()

    async def transcribe_audio(
        self, audio_data: bytes, prompt: str = "", language: str = "en"
    ) -> str:
        try:
            import tempfile

            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
            temp_file_path = temp_file.name
            try:
                with open(temp_file_path, "wb") as f:
                    f.write(audio_data)

                loop = asyncio.get_event_loop()
                transcription_func = partial(
                    self.groq_client.audio.transcriptions.create,
                    file=(temp_file_path, open(temp_file_path, "rb")),
                    model="distil-whisper-large-v3-en",
                    response_format="json",
                    temperature=0.0,
                    prompt=prompt if prompt else None,
                    language=language if language else None,
                )

                transcription = await loop.run_in_executor(None, transcription_func)
                return transcription.text
            finally:
                import os

                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
        except Exception as e:
            logger.error(f"Error in transcribe_audio: {str(e)}")
            raise

    async def process_query(self, query: str) -> Dict[str, Any]:
        messages = [
            {
                "role": "system",
                "content": """You are a Pokédex. Determine if the user is asking about a Pokémon. Use a tool to answer, or respond with the following structure:

{
  "sections": [
    {
      "title": "Summary",
      "content": "Answer as a Pokédex would by answering in a way that would be useful to a Pokémon trainer. If the user asked a specific question answer it here. If the user asked for a Pokémon that doesn't exist, tell them that you don't have any data on that Pokémon. Do not include links to cries or sprites here."
    }
  ]
}

Respond with ONLY valid JSON that follows this structure.""",
            },
            {"role": "user", "content": query},
        ]

        logger.info(f"messages: {json.dumps(messages)}")

        try:
            response = await self.session.list_tools()
            available_tools = [
                {
                    "type": "function",
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.inputSchema,
                }
                for tool in response.tools
            ]

            completion = self.openai.responses.create(
                model="gpt-4o-mini", input=messages, tools=available_tools
            )

            logger.debug(f"completion: {json.dumps(completion.to_dict(), indent=2)}")

            raw_data = None

            if completion.output and hasattr(completion.output[0], "name"):
                tool_call = completion.output[0]
                messages.append(tool_call)

                function_name = tool_call.name
                function_args = json.loads(tool_call.arguments)
                logger.info(f"Calling tool {function_name} with args {function_args}")

                result = await self.session.call_tool(function_name, function_args)
                logger.debug(f"Result: {result.model_dump_json()}")

                try:
                    content_text = result.content[0].text
                    raw_data = json.loads(content_text)
                except (json.JSONDecodeError, IndexError, AttributeError) as e:
                    logger.error(f"Error parsing result content: {e}")

                messages.append(
                    {
                        "type": "function_call_output",
                        "call_id": tool_call.call_id,
                        "output": result.content[0].text,
                    }
                )

                messages.append(
                    {
                        "role": "system",
                        "content": """Structure your response as a JSON object with the following sections:

{
  "sections": [
    {
      "title": "Summary",
      "content": "Answer as a Pokédex would by naming the Pokémon and giving a brief description and some facts about the Pokémon that would be useful to a Pokémon trainer. If the user asked a specific question answer it here. If the user asked for a Pokémon that doesn't exist, tell them that you don't have any data on that Pokémon. Do not include links to cries or sprites here."
    },
    {
      "title": "Types",
      "content": "The Pokémon's primary and secondary types"
    },
    {
      "title": "Base Stats",
      "content": "- HP: [value]\\n- Attack: [value]\\n- Defense: [value]\\n- Sp. Attack: [value]\\n- Sp. Defense: [value]\\n- Speed: [value]"
    },
    {
      "title": "Abilities",
      "content": "List and brief description of abilities"
    },
    {
      "title": "Evolution",
      "content": "Evolution chain information"
    },
    {
      "title": "Additional Info",
      "content": "Other notable facts or interesting trivia about the Pokemon. Do not include links to cries or sprites here."
    }
  ]
}

Format the content of each section in Markdown. If a section doesn't have relevant information, you can omit it. For multiple Pokémon, add a separate object for each in an array.
Do not make up information or Pokémon that don't exist. If you don't know the answer, leave the section out.
If a user asks about nidoran without specifying gender, default to nidoran-m.
Respond with ONLY valid JSON that follows this structure - do not include any explanatory text outside the JSON.""",
                    }
                )

                final_response = self.openai.responses.create(
                    model="gpt-4o-mini", input=messages
                )

                try:
                    response_text = final_response.output_text.strip()
                    if response_text.startswith("```json") and response_text.endswith(
                        "```"
                    ):
                        response_text = response_text[7:-3].strip()
                    elif response_text.startswith("```") and response_text.endswith(
                        "```"
                    ):
                        response_text = response_text[3:-3].strip()

                    structured_data = json.loads(response_text)
                    return {
                        "structured_data": structured_data,
                        "raw_markdown": self._convert_structured_to_markdown(
                            structured_data
                        ),
                        "raw_data": raw_data,
                    }
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing structured response: {e}")
                    return {
                        "structured_data": None,
                        "raw_markdown": final_response.output_text,
                        "raw_data": raw_data,
                    }
            else:
                logger.info("Model responded directly without using tools")
                try:
                    # Try to parse the response as JSON directly
                    response_text = completion.output[0].content[0].text.strip()

                    # Clean up the response if it has markdown code blocks
                    if response_text.startswith("```json") and response_text.endswith(
                        "```"
                    ):
                        response_text = response_text[7:-3].strip()
                    elif response_text.startswith("```") and response_text.endswith(
                        "```"
                    ):
                        response_text = response_text[3:-3].strip()

                    structured_data = json.loads(response_text)
                    return {
                        "structured_data": structured_data,
                        "raw_markdown": self._convert_structured_to_markdown(
                            structured_data
                        ),
                        "raw_data": None,
                    }
                except (json.JSONDecodeError, Exception) as e:
                    logger.error(f"Error parsing direct response: {e}")
                    # If parsing fails, use the text as is
                    return {
                        "structured_data": {
                            "sections": [
                                {
                                    "title": "Response",
                                    "content": completion.output[0].content[0].text,
                                }
                            ]
                        },
                        "raw_markdown": completion.output[0].content[0].text,
                        "raw_data": None,
                    }
        except Exception as e:
            logger.error(f"Error in process_query: {e}")
            return {
                "structured_data": {
                    "sections": [
                        {
                            "title": "Error",
                            "content": f"An error occurred while processing your query: {str(e)}",
                        }
                    ]
                },
                "raw_markdown": f"An error occurred while processing your query: {str(e)}",
                "raw_data": None,
            }

    def _convert_structured_to_markdown(self, structured_data: Dict[str, Any]) -> str:
        if not structured_data or "sections" not in structured_data:
            return "No data available"

        markdown = ""
        for section in structured_data["sections"]:
            markdown += f"## {section['title']}\n\n{section['content']}\n\n"

        return markdown.strip()


mcp_client = MCPClient()


@post("/service/pokemon/chat")
async def pokedex_chat(data: Dict[str, str]) -> Dict[str, Any]:
    try:
        query = data.get("query", "")
        if not query:
            return Response(
                content={"error": "You need to ask something."},
                status_code=404,
                media_type="application/json",
            )
        response = await mcp_client.process_query(query)
        return Response(
            content={
                "structured_data": response["structured_data"],
                "text": response["raw_markdown"],
                "pokemon_data": response["raw_data"],
            },
            status_code=200,
            media_type="application/json",
        )
    except Exception as e:
        logger.error(f"There was an error chatting with Pokedex: {e}")
        return Response(
            content={"error": str(e)}, status_code=500, media_type="application/json"
        )


@post("/service/speech-to-text", media_type=MediaType.JSON)
async def speech_to_text(
    data: Annotated[UploadFile, Body(media_type=RequestEncodingType.MULTI_PART)],
) -> Response:
    try:
        if not data:
            return Response(
                content={"error": "No audio file provided"},
                status_code=400,
                media_type=MediaType.JSON,
            )

        logger.info(
            f"Received file: {data.filename}, content_type: {data.content_type}"
        )

        audio_data = await data.read()

        if not audio_data:
            return Response(
                content={"error": "Empty audio file"},
                status_code=400,
                media_type=MediaType.JSON,
            )

        logger.info(f"Audio data size: {len(audio_data)} bytes")

        language = "en"
        prompt = "Expect Pokémon names and terms. Correct spelling to match known Pokémon names."

        transcript = await mcp_client.transcribe_audio(audio_data, prompt, language)

        return Response(
            content={"transcript": transcript},
            status_code=200,
            media_type=MediaType.JSON,
        )
    except Exception as e:
        logger.error(f"Error in speech-to-text endpoint: {str(e)}")
        return Response(
            content={"error": str(e)},
            status_code=500,
            media_type=MediaType.JSON,
        )


@post("/service/analyze-image", media_type=MediaType.JSON)
async def analyze_image(
    data: Annotated[UploadFile, Body(media_type=RequestEncodingType.MULTI_PART)],
) -> Response:
    try:
        if not data:
            return Response(
                content={"error": "No image file provided"},
                status_code=400,
                media_type=MediaType.JSON,
            )

        logger.info(
            f"Received image file: {data.filename}, content_type: {data.content_type}"
        )

        image_data = await data.read()

        if not image_data:
            return Response(
                content={"error": "Empty image file"},
                status_code=400,
                media_type=MediaType.JSON,
            )

        logger.info(f"Image data size: {len(image_data)} bytes")

        base64_image = base64.b64encode(image_data).decode("utf-8")
        identification_prompt = """
        You're a Pokémon expert. Look at this image and identify if there's a Pokémon in it. 
        
        If you see a Pokémon:
        1. What Pokémon is it? Be specific about the exact name, matching the official Pokémon database.
        2. How confident are you in this identification (high, medium, low)?
        
        If you don't see any Pokémon or can't confidently identify one, just say "No Pokémon identified".
        
        Respond in JSON format only with these fields:
        {
          "pokemon_identified": true/false,
          "pokemon_name": "name" or null,
          "confidence": "high/medium/low" or null
        }
        
        Important: Make sure the pokemon_name is spelled correctly and matches official Pokémon game databases.
        If you see nidoran without clear gender, use "nidoran-m".
        """

        try:
            identification_response = await asyncio.to_thread(
                lambda: mcp_client.openai.responses.create(
                    model="gpt-4o-mini",
                    input=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "input_text", "text": identification_prompt},
                                {
                                    "type": "input_image",
                                    "image_url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            ],
                        }
                    ],
                )
            )

            # Find JSON in the response
            json_match = re.search(
                r"({.*})", identification_response.output_text, re.DOTALL
            )
            if not json_match:
                logger.error("No JSON found in GPT-4o-mini identification response")
                return Response(
                    content={"error": "Could not parse image analysis results"},
                    status_code=500,
                    media_type=MediaType.JSON,
                )

            image_id_result = json.loads(json_match.group(1))

            # If a Pokémon was identified, get its data
            pokemon_data = None
            structured_response = None

            if image_id_result.get("pokemon_identified") and image_id_result.get(
                "pokemon_name"
            ):
                # Clean up the pokemon name (lowercase, remove spaces)
                pokemon_name = image_id_result["pokemon_name"].lower().replace(" ", "-")
                try:
                    # Get Pokémon data using the existing MCP tool
                    session = await mcp_client.get_session()
                    result = await session.call_tool(
                        "get_basic_pokemon_data", {"pokemon_name": pokemon_name}
                    )

                    try:
                        content_text = result.content[0].text
                        pokemon_data = json.loads(content_text)

                        # Now use the Pokémon data to generate a structured response similar to process_query
                        # Start with system prompt
                        system_prompt = """You are a Pokédex. You're analyzing a photo of a Pokémon.
                        
Structure your response as a JSON object with the following sections:

{
  "sections": [
    {
      "title": "Pokémon Identified",
      "content": "Answer as a Pokédex would by naming the Pokémon and giving a brief description and some facts about the Pokémon that would be useful to a Pokémon trainer."
    },
    {
      "title": "Types",
      "content": "The Pokémon's primary and secondary types"
    },
    {
      "title": "Base Stats",
      "content": "- HP: [value]\\n- Attack: [value]\\n- Defense: [value]\\n- Sp. Attack: [value]\\n- Sp. Defense: [value]\\n- Speed: [value]"
    },
    {
      "title": "Abilities",
      "content": "List and brief description of abilities"
    },
    {
      "title": "Evolution",
      "content": "Evolution chain information if available"
    },
    {
      "title": "Additional Info",
      "content": "Other notable facts or interesting trivia about the Pokemon. Do not include links to cries or sprites here."
    }
  ]
}

Format the content of each section in Markdown. If a section doesn't have relevant information, you can omit it.
Respond with ONLY valid JSON that follows this structure - do not include any explanatory text outside the JSON."""

                        assistant_message = f"""I've identified a {pokemon_data["name"]} in a photo with {image_id_result["confidence"]} confidence.
Here's the Pokémon's data:

{json.dumps(pokemon_data, indent=2)}

Generate a structured Pokédex response about this Pokémon."""

                        # Get structured response from GPT
                        gpt_response = await asyncio.to_thread(
                            lambda: mcp_client.openai.chat.completions.create(
                                model="gpt-4o-mini",
                                temperature=0.7,
                                messages=[
                                    {"role": "system", "content": system_prompt},
                                    {"role": "assistant", "content": assistant_message},
                                ],
                            )
                        )

                        response_text = gpt_response.choices[0].message.content.strip()
                        # Clean up the response if it has markdown code blocks
                        if response_text.startswith(
                            "```json"
                        ) and response_text.endswith("```"):
                            response_text = response_text[7:-3].strip()
                        elif response_text.startswith("```") and response_text.endswith(
                            "```"
                        ):
                            response_text = response_text[3:-3].strip()

                        structured_response = json.loads(response_text)

                    except Exception as e:
                        logger.error(
                            f"Error processing Pokemon data or generating response: {e}"
                        )
                        structured_response = {
                            "sections": [
                                {
                                    "title": "Error Processing",
                                    "content": f"I identified a {image_id_result['pokemon_name']} but encountered an error while processing its data: {str(e)}",
                                }
                            ]
                        }
                except Exception as e:
                    logger.error(f"Error getting Pokémon data: {e}")
                    structured_response = {
                        "sections": [
                            {
                                "title": "Data Retrieval Error",
                                "content": f"I identified a {image_id_result['pokemon_name']} but couldn't retrieve its data: {str(e)}",
                            }
                        ]
                    }
            else:
                # No Pokémon was identified, create a simple structured response
                structured_response = {
                    "sections": [
                        {
                            "title": "No Pokémon Identified",
                            "content": "I couldn't identify any Pokémon in this image. Please try again with a clearer image of a Pokémon.",
                        }
                    ]
                }

            # Build the response with all the data we've collected
            analysis_result = {
                "identification": image_id_result,
                "pokemon_data": pokemon_data,
                "structured_data": structured_response,
                "raw_markdown": convert_structured_to_markdown(structured_response)
                if structured_response
                else "No data available",
            }

            return Response(
                content=analysis_result,
                status_code=200,
                media_type=MediaType.JSON,
            )

        except Exception as e:
            logger.error(f"Error in image analysis: {str(e)}")
            return Response(
                content={"error": f"Image analysis failed: {str(e)}"},
                status_code=500,
                media_type=MediaType.JSON,
            )

    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return Response(
            content={"error": str(e)},
            status_code=500,
            media_type=MediaType.JSON,
        )


# Add this helper function for converting structured data to markdown
def convert_structured_to_markdown(structured_data):
    if not structured_data or "sections" not in structured_data:
        return "No data available"

    markdown = ""
    for section in structured_data["sections"]:
        markdown += f"## {section['title']}\n\n{section['content']}\n\n"

    return markdown.strip()


async def startup() -> None:
    logger.info("Running app starup")
    await mcp_client.initialize_session()


async def cleanup() -> None:
    await mcp_client.cleanup()
    logger.info("MCP client connection terminated")


static_files_router = create_static_files_router(
    directories=["frontend/dist"],
    path="/",
    html_mode=True,
    name="frontend-artifact",
    include_in_schema=False,
)

app = Litestar(
    route_handlers=[pokedex_chat, speech_to_text, analyze_image, static_files_router],
    debug=True,
    on_startup=[startup],
    on_shutdown=[cleanup],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
