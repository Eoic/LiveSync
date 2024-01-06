import json
import asyncio
import websockets
from uuid import UUID
from websockets import WebSocketServerProtocol

PORT = 6789
USERS = set()


def user_connected_msg(id: UUID):
    return json.dumps({"type": "USER_CONNECT", "payload": {"id": str(id)}})


def user_disconnected_msg(id: UUID):
    return json.dumps({"type": "USER_DISCONNECT", "payload": {"id": str(id)}})


def connections_msg(users: list[WebSocketServerProtocol], recipient_id: UUID):
    return json.dumps(
        {
            "type": "CONNECTIONS",
            "payload": {
                "users": list(
                    map(
                        lambda user: {
                            "id": str(user.id),
                            "owner": user.id == recipient_id,
                        },
                        users,
                    )
                )
            },
        }
    )


def position_event_msg(id: UUID, position: dict[float, float] = {'x': 0, 'y': 0}):
    return json.dumps({"type": "PLAYER_POSITION", "payload": {"id": str(id), "position": position}})


def other_users(users: set, current_user: websockets.WebSocketServerProtocol):
    return set(filter(lambda user: user.id != current_user.id, users))


async def handler(websocket: WebSocketServerProtocol):
    global USERS

    try:
        USERS.add(websocket)
        print("Connected user with id ", websocket.id)
        await websocket.send(connections_msg(USERS, websocket.id))
        websockets.broadcast(
            other_users(USERS, websocket), user_connected_msg(websocket.id)
        )

        async for message in websocket:
            event = json.loads(message)

            match event.get("type"):
                case "PLAYER_POSITION":
                    websockets.broadcast(
                        other_users(USERS, websocket),
                        position_event_msg(websocket.id, event.get("payload").get("position")),
                    )
                case _:
                    pass
    finally:
        print("Disconnected user with id ", websocket.id)
        USERS.remove(websocket)
        websockets.broadcast(
            other_users(USERS, websocket), user_disconnected_msg(websocket.id)
        )


async def main():
    async with websockets.serve(handler, "localhost", PORT):
        print("Server is running on port", PORT)
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
