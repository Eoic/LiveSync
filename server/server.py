import json
import asyncio
import websockets
from uuid import UUID
from queue import Queue
from dataclasses import dataclass, asdict
from websockets import WebSocketServerProtocol


PORT = 6789
USERS = set()
UPDATE_RATE_HZ = 60
ENTITIES = dict()
MSG_QUEUE = Queue()
LAST_PROCESSED_INPUT = dict()


@dataclass
class Point:
    x: int
    y: int


class Entity(object):
    id: str
    position: Point 
    positions_buffer: list[Point]

    def __init__(self, id):
        self.id = id
        self.position = Point(0, 0)
        self.positions_buffer = []

    def apply_input(self, input):
        self.position.x = input.get('x')
        self.position.y = input.get('y')


def user_connected_msg(id: UUID):
    return json.dumps({'type': 'USER_CONNECT', 'payload': {'id': str(id)}})


def user_disconnected_msg(id: UUID):
    return json.dumps({'type': 'USER_DISCONNECT', 'payload': {'id': str(id)}})


def connections_msg(users: list[WebSocketServerProtocol], recipient_id: UUID):
    return json.dumps(
        {
            'type': 'CONNECTIONS',
            'payload': {
                'users': list(
                    map(
                        lambda user: {
                            'id': str(user.id),
                            'owner': user.id == recipient_id,
                        },
                        users,
                    )
                )
            },
        }
    )


def position_event_msg(id: UUID, position: dict[float, float] = {'x': 0, 'y': 0}):
    return json.dumps({'type': 'PLAYER_POSITION', 'payload': {'id': str(id), 'position': position}})


def other_users(users: set, current_user: websockets.WebSocketServerProtocol):
    return set(filter(lambda user: user.id != current_user.id, users))


def send_world_state():
    world_state = dict()

    for entity in ENTITIES.values():
        world_state[entity.id] = {
            'id': entity.id,
            'position': asdict(entity.position),
            'last_processed_input': LAST_PROCESSED_INPUT.get(entity.id)
        }

    if not len(world_state):
        return

    world_state = {'type': 'WORLD_STATE', 'payload': world_state}
    websockets.broadcast(USERS, json.dumps(world_state))


def process_inputs():
    while True:
        if MSG_QUEUE.empty():
            break;

        message = MSG_QUEUE.get()

        id = message.get('id')
        seq_id = message.get('seq_id')
        entity = ENTITIES.get(id)

        if entity:
            ENTITIES[id].apply_input(message.get('position'))
            LAST_PROCESSED_INPUT[id] = seq_id


async def update():
    while True:
        process_inputs()
        send_world_state()        
        await asyncio.sleep(1 / UPDATE_RATE_HZ)


async def handler(websocket: WebSocketServerProtocol):
    global USERS
    global MSG_QUEUE
    global ENTITIES

    try:
        USERS.add(websocket)
        ENTITIES[str(websocket.id)] = Entity(str(websocket.id))

        print('Connected user with id ', websocket.id)
        await websocket.send(connections_msg(USERS, websocket.id))
        websockets.broadcast(
            other_users(USERS, websocket), user_connected_msg(websocket.id)
        )

        async for message in websocket:
            event = json.loads(message)

            match event.get('type'):
                case 'PLAYER_POSITION':
                    MSG_QUEUE.put(event.get('payload'))
                case _:
                    pass
    finally:
        print('Disconnected user with id ', websocket.id)
        USERS.remove(websocket)
        del ENTITIES[str(websocket.id)]

        websockets.broadcast(
            other_users(USERS, websocket), user_disconnected_msg(websocket.id)
        )


async def main():
    update_task = asyncio.create_task(update())

    async with websockets.serve(handler, 'localhost', PORT):
        print('Server is running on port', PORT)
        await update_task


if __name__ == '__main__':
    asyncio.run(main())
