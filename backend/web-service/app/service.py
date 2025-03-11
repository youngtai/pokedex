from typing import Dict, List, Optional
from pathlib import Path
from litestar import Litestar, get, post
from litestar.response import Response
from litestar.static_files import StaticFilesConfig
import uvicorn

@get("/api")
async def hello_world() -> str:
    return "Hello, Pokedex!"

@get("/api/hello/{name:str}")
async def hello_name(name: str) -> Dict[str, str]:
    return {"message": f"Hello, {name}!"}

@get("/api/items")
async def get_items() -> List[Dict[str, str]]:
    return [
        {"id": "1", "name": "Item 1"},
        {"id": "2", "name": "Item 2"},
        {"id": "3", "name": "Item 3"},
    ]

@post("/api/items")
async def create_item(data: Dict[str, str]) -> Dict[str, str]:
    return {"id": "4", **data, "status": "created"}

@get("/api/status")
async def status() -> Response:
    return Response(
        content={"status": "operational"},
        status_code=200,
        media_type="application/json"
    )

app = Litestar(
    route_handlers=[hello_world, hello_name, get_items, create_item, status],
    static_files_config=[
        StaticFilesConfig(
            directories=["frontend/dist"],
            path="/",
            html_mode=True,
        ),
    ],
    debug=True
)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)
