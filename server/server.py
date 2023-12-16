import json
import asyncio
import websockets
from websockets import WebSocketServerProtocol

PORT = 6789
USERS = set()

def users_event():
    return json.dumps({'type': 'users', 'connected': len(USERS)})

def position_event(position):
    return json.dumps({'type': 'position', 'position': position})

async def handler(websocket: WebSocketServerProtocol):
    global USERS

    try:
        USERS.add(websocket)
        print('Connected user with id ', websocket.id)
        websockets.broadcast(USERS, users_event())

        async for message in websocket:
            event = json.loads(message)

            match event.get('type'):
                case 'position':
                    websockets.broadcast(USERS - {websocket,}, position_event(event.get('position')))
                case _:
                    pass
    finally:
        print('Disconnected user with id ', websocket.id)
        USERS.remove(websocket)
        websockets.broadcast(USERS, users_event())

async def main():
    async with websockets.serve(handler, 'localhost', PORT):
        print('Server is running on port', PORT)
        await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())
