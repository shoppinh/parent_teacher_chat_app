import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import socketIOClient from "socket.io-client";

const socketGatewayHost = "http://localhost:8000";
//const socketGatewayHost = "https://umenu-api-d-cl.niteco.dev";

function App() {
    const [mess, setMess] = useState([]);
    const [message, setMessage] = useState('');
    const [id, setId] = useState();
    const [token, setToken] = useState('');
    const [role, setRole] = useState(5);
    const [myPhone, setMyPhone] = useState('0902932486');
    const [toRole, setToRole] = useState(2);
    const [toPhone, setToPhone] = useState('0917735107');
    const [headerToken, setHeaderToken] = useState('');
    const [fromUser, setFromUser] = useState('');
    const [toUser, setToUser] = useState('');
    const [roomId, setRoomId] = useState('');
    const [orderId, setOrderId] = useState('0');
    const [contentType, setContentType] = useState('text');

    const socketRef = useRef(null);


    useEffect(() => {
        //user test
        if (!headerToken) {
            return
        }
        const socketOptions = {
            transports: ['websocket'],
            query: {
                Authorization: headerToken, //token
            },
        }
        socketRef.current = socketIOClient(socketGatewayHost, socketOptions);

        socketRef.current.on("connect_error", () => {
            console.log("connect_error");

        });

        socketRef.current.on("disconnect", () => {
            console.log("disconnect");

        });

        socketRef.current.on('connect_failed', (data) => {
            console.log('Connection Failed', data);

        });

        socketRef.current.on('exception', (data) => {
            console.log('exception', data);

        });

        socketRef.current.on('connected', data => {
            console.log(data);
            socketRef.current.emit('register_device', {
                mobilePhone: myPhone,
                userName: 'My Consumer',
                roleId: role
            });
        });

        //Done register device
        socketRef.current.on('register_device_response', user => {
            console.log('register_device_response:', user)

            //Start call JOIN_ROOM event
        });

        //get room conversation info and join in
        socketRef.current.on('room', room => {
            console.log('room:', room)
            setId(room.id);
            setFromUser(room.fromUser);
            setToUser(room.toUser);
        });

        //receive message from server
        socketRef.current.on('receive_message', messages => {
            console.log('receive_message', messages);
            if (Array.isArray(messages)) {
                setMess(oldMsgs => [...oldMsgs, ...messages])
            } else {
                setMess(oldMsgs => [...oldMsgs, messages])
            }
        }) // mỗi khi có tin nhắn thì mess sẽ được render thêm

        return () => {
            socketRef.current.disconnect();
        };
    }, [headerToken, myPhone, role]);


    const requestConnect = () => {
        console.log('requestConnect',socketRef.current)
        socketRef.current.emit('join_room', {
            from: {
                mobilePhone: myPhone,
                role: role,
            },
            to: {
                mobilePhone: toPhone,
                role: toRole,
            },
            roomId,
            orderId,
        });
    }

    const sendMessage = () => {
        if (id && message && message.trim() !== null) {
            const msg = {
                content: message,
                roomId: id,
                contentType,
                menuGUID: '585d2a68-7df8-42dd-825e-27a1e3c8ec9d',
                fromUser,
                toUser
            }
            socketRef.current.emit('send_message', msg)
            setMessage('')
        }
    }

    const Msg = ({isMine, content, user}) => (
        <div style={{
            width: '100%',
            background: isMine ? 'aliceblue' : 'white',
            alignSelf: isMine ? 'end' : 'start',
            padding: 5,
        }}>
            {!isMine ? <><b>{user}</b><br/></> : null}
            {content}
        </div>
    )

    const renderMess = mess.map((m, index) =>
        <Msg
            key={index}
            isMine={m.createdBy === token}
            content={m.content}
            user={m.fromUser.userName}
        />
    )

    return (<div className="box-chat">
        <form>
            <label htmlFor="Id">ID: {id}</label><br />
            <label htmlFor="Role">My Role:</label><br />
            <input type="text" value={role} onChange={e => setRole(e.target.value)} /><br />
            <label htmlFor="Role">My phone:</label><br />
            <input type="text" value={myPhone} onChange={e => setMyPhone(e.target.value)} /><br />

            <label htmlFor="lname">My Token:</label><br />
            <input type="text" value={token} onChange={e => setToken(e.target.value)} /><br /><br />
            <input type="button" onClick={() => setHeaderToken(token)} value="Set Token" />

            <br /><br />
            <label htmlFor="Role">To Phone:</label><br />
            <input type="text" value={toPhone} onChange={e => setToPhone(e.target.value)} /><br />
            <label htmlFor="Role">To Role:</label><br />
            <input type="text" value={toRole} onChange={e => setToRole(e.target.value)} /><br /><br />

            <label htmlFor="Role">Room:</label><br />
            <input type="text" value={roomId} onChange={e => setRoomId(e.target.value)} /><br /><br />

            <label htmlFor="Role">OrderId:</label><br />
            <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} /><br /><br />

            <input type="button" onClick={() => requestConnect(token)} value="Request Connect" />

            <br /><br />
            <div className="send-box">
              <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Nhập tin nhắn ..."
              /><br />
                <label htmlFor="Role">Message Type:</label><br />
                <input type="text" value={contentType} onChange={e => setContentType(e.target.value)} /><br /><br />
              <button type={'button'} onClick={sendMessage}>
                  Send
              </button>
            </div>
        </form>

        <div className="box-chat_message" style={{'width': 200, display: 'flex', flexDirection: 'column'}}>
            {renderMess}
        </div>

    </div>
);
}

export default App;
