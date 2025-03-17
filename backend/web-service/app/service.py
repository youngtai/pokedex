from typing import Optional
from contextlib import AsyncExitStack
import logging
from typing import Dict, Any, List
from litestar import Litestar, post
from litestar.response import Response
import uvicorn
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from openai import OpenAI
from dotenv import load_dotenv
import json
from anthropic import Anthropic
from litestar.static_files import create_static_files_router

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pokeapi-web-server")


class MCPClient:
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.openai = OpenAI()
        self.anthropic = Anthropic()

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

    async def process_query(self, query: str) -> Dict[str, Any]:
        """Process a query using the OpenAI API and MCP tools"""
        messages = [
            {
                "role": "system",
                "content": """You are a Pokédex AI assistant. When providing information about Pokémon, structure your response in the following sections:

1. Summary: A brief overview of the Pokémon
2. Stats: Formatted key stats
3. Types: The Pokémon's type(s)
4. Abilities: List of abilities
5. Additional Info: Any other relevant details

When multiple Pokémon are involved, organize information clearly by Pokémon name.
Respond in Markdown format with appropriate headers for each section.
""",
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

                # Get the raw result
                result = await self.session.call_tool(function_name, function_args)
                logger.debug(f"Result: {result.model_dump_json()}")

                # Extract raw data from result
                try:
                    content_text = result.content[0].text
                    raw_data = json.loads(content_text)
                except (json.JSONDecodeError, IndexError, AttributeError) as e:
                    logger.error(f"Error parsing result content: {e}")

                # Add tool call results to messages
                messages.append(
                    {
                        "type": "function_call_output",
                        "call_id": tool_call.call_id,
                        "output": result.content[0].text,
                    }
                )

                # Add specific instructions for structuring the response
                messages.append(
                    {
                        "role": "system",
                        "content": """Structure your response as a JSON object with the following sections:
                        
{
  "sections": [
    {
      "title": "Summary",
      "content": "A concise description of the Pokémon"
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
Respond with ONLY valid JSON that follows this structure - do not include any explanatory text outside the JSON.""",
                    }
                )

                final_response = self.openai.responses.create(
                    model="gpt-4o-mini", input=messages
                )

                # Parse the JSON response
                try:
                    response_text = final_response.output_text.strip()
                    # Extract JSON if it's wrapped in backticks
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
                    # Fallback to returning the raw text if JSON parsing fails
                    return {
                        "structured_data": None,
                        "raw_markdown": final_response.output_text,
                        "raw_data": raw_data,
                    }
            else:
                logger.info("Model responded directly without using tools")
                try:
                    # Try to structure the direct response
                    messages.append(
                        {
                            "role": "system",
                            "content": """Convert your response to a JSON object with the following structure:
                            
{
  "sections": [
    {
      "title": "Summary",
      "content": "Your response formatted as markdown"
    }
  ]
}

Respond with ONLY valid JSON that follows this structure.""",
                        }
                    )

                    structured_response = self.openai.responses.create(
                        model="gpt-4o-mini",
                        input=messages
                        + [
                            {
                                "role": "assistant",
                                "content": completion.output[0].content[0].text,
                            }
                        ],
                    )

                    response_text = structured_response.output_text.strip()
                    # Extract JSON if it's wrapped in backticks
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
                    logger.error(f"Error structuring direct response: {e}")
                    # Fallback to simple section format
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
        """Convert structured data to Markdown format"""
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
    route_handlers=[pokedex_chat, static_files_router],
    debug=True,
    on_startup=[startup],
    on_shutdown=[cleanup],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
