from fastapi import FastAPI, Response
from starlette.middleware.cors import CORSMiddleware

def apply_permissive_cors(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        allow_credentials=False,
        max_age=86400,
    )

    @app.options("/{rest_of_path:path}")
    def _cors_preflight(rest_of_path: str):  # noqa: F401
        return Response(status_code=204)
