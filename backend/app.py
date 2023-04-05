import json
import uuid
import asyncio
import websockets
from typing import Dict
from websockets.server import WebSocketServerProtocol
from SimpleChatBridge import SimpleChatBridge
from OCR import OCR

HTTP_SERVER_PORT = 8080


async def respond(ws: WebSocketServerProtocol):
    async def on_response(response: Dict[str, str]) -> None:
        res = json.dumps(response)
        await ws.send(res)

    async def on_chat_response(data: str, streaming_status: str) -> None:
        resObject = {"event": "text", "text": data, "stream": streaming_status}
        await on_response(resObject)

    async def on_image_response(data: str) -> None:
        resObject = {"event": "image", "text": data}
        await on_response(resObject)

    async def on_error_response(text: str) -> None:
        resObject = {"error": text}
        res = json.dumps(resObject)
        await ws.send(res)

    new_uuid = uuid.uuid4()

    print("WS connection opened")
    chatBridge = SimpleChatBridge(new_uuid, on_chat_response, on_error_response)
    ocr = OCR()

    async for message in ws:
        data = json.loads(message)

        if data.get("event") is None:
            await on_error_response(
                "Invalid object. Refer to our documentation for more details."
            )
            continue

        if data["event"] == "text":
            if data.get("text") is None or data.get("name") is None:
                await on_error_response("Missing 'text' or 'name' field")
                continue
            chatBridge.generate_messages(input=data["text"], name=data["name"])
            await chatBridge.send_chat()

        if data["event"] == "image":
            if data.get("content") is None:
                await on_error_response("Missing 'content' field")
                continue
            content = ocr.base64_to_bytes(data["content"])
            text = ocr.get_prompt_text(content)
            await on_image_response(text)

    print("WS connection closed")


async def main(port: int = HTTP_SERVER_PORT) -> None:
    async with websockets.serve(respond, None, port, max_size=2*(2 ** 20)): # 2 MB max size
        print(f"server listening on: http://localhost:{port}")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
