import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Tooltip } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "./videoMeet.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close';
import server from '../environment';

const server_url = server;

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();
    // Ref to store peer connections component-scoped
    let connectionsRef = useRef({});

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(false);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    // Room ID state
    const [roomId, setRoomId] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // Typing state
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    // Ref to store mapping of socketId -> username
    const usersRef = useRef({});

    useEffect(() => {
        getPermissions();

        // Prefill username if logged in
        const savedUsername = localStorage.getItem("username");
        if (savedUsername) {
            setUsername(savedUsername);
        }

        // Set initial Room ID from URL
        // Removing the leading slash
        const currentPath = window.location.pathname.substring(1);
        if (currentPath === "join-meet") {
            setRoomId("");
        } else {
            setRoomId(currentPath);
        }

    }, [])

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio])

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connectionsRef.current) {
            if (id === socketIdRef.current) continue;

            const connection = connectionsRef.current[id];

            try {
                connection.addStream(window.localStream);
            } catch (e) { }


            connection.createOffer().then((description) => {
                connection.setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connection.localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connectionsRef.current) {
                const connection = connectionsRef.current[id];
                connection.addStream(window.localStream)

                connection.createOffer().then((description) => {
                    connection.setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connection.localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }

    let getDislayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connectionsRef.current) {
            if (id === socketIdRef.current) continue

            connectionsRef.current[id].addStream(window.localStream)

            connectionsRef.current[id].createOffer().then((description) => {
                connectionsRef.current[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connectionsRef.current[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                if (!connectionsRef.current[fromId]) return;

                connectionsRef.current[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connectionsRef.current[fromId].createAnswer().then((description) => {
                            connectionsRef.current[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connectionsRef.current[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                if (connectionsRef.current[fromId]) {
                    connectionsRef.current[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
                }
            }
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.pathname, username)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', (data, sender, socketIdSender) => {
                console.log("Frontend received chat-message:", data, sender, socketIdSender);
                addMessage(data, sender, socketIdSender);
            })

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => {
                    const filtered = videos.filter((video) => video.socketId !== id);
                    videoRef.current = filtered;
                    return filtered;
                });
                if (connectionsRef.current[id]) {
                    connectionsRef.current[id].close();
                    delete connectionsRef.current[id];
                }
            })

            socketRef.current.on('typing', (id) => {
                if (id !== socketIdRef.current) {
                    setIsTyping(true);
                }
            })

            socketRef.current.on('stop-typing', (id) => {
                if (id !== socketIdRef.current) {
                    setIsTyping(false);
                }
            })

            socketRef.current.on('user-joined', (id, clients, users) => {

                if (users) {
                    usersRef.current = users;
                }

                clients.forEach((socketListId) => {
                    if (socketListId === socketIdRef.current) return;
                    if (connectionsRef.current[socketListId]) return;

                    connectionsRef.current[socketListId] = new RTCPeerConnection(peerConfigConnections)

                    connectionsRef.current[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connectionsRef.current[socketListId].onaddstream = (event) => {

                        // Use functional state update to prevent race conditions
                        setVideos(prevVideos => {
                            const remoteUsername = usersRef.current[socketListId] || "Guest";

                            // Check if index exists in the *current* state snapshot
                            const existingIndex = prevVideos.findIndex(v => v.socketId === socketListId);

                            if (existingIndex !== -1) {
                                // Replace existing
                                const newVideos = [...prevVideos];
                                newVideos[existingIndex] = {
                                    ...newVideos[existingIndex],
                                    stream: event.stream,
                                    username: remoteUsername
                                };
                                videoRef.current = newVideos;
                                return newVideos;
                            } else {
                                // Add new
                                const newVideo = {
                                    socketId: socketListId,
                                    stream: event.stream,
                                    autoplay: true,
                                    playsinline: true,
                                    username: remoteUsername
                                };
                                const newVideos = [...prevVideos, newVideo];
                                videoRef.current = newVideos;
                                return newVideos;
                            }
                        });
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connectionsRef.current[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connectionsRef.current[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connectionsRef.current) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connectionsRef.current[id2].addStream(window.localStream)
                        } catch (e) { }

                        connectionsRef.current[id2].createOffer().then((description) => {
                            connectionsRef.current[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connectionsRef.current[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        setVideo(!video);
    }
    let handleAudio = () => {
        setAudio(!audio)
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);

        if (!typing) {
            setTyping(true);
            socketRef.current.emit('typing', window.location.pathname);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setTyping(false);
            socketRef.current.emit('stop-typing', window.location.pathname);
        }, 2000);
    }

    const chatEndRef = useRef(null)

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, showModal])

    const formatTime = () => {
        const d = new Date();
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const addMessage = (data, sender, socketIdSender) => {
        console.log("addMessage called. Data:", data, "Sender:", sender, "SocketIdSender:", socketIdSender, "MySocketId:", socketIdRef.current);
        // Filter out self-messages to avoid duplicates (since we add them optimistically)
        if (socketIdSender === socketIdRef.current) {
            console.log("Filtering out self-message");
            return;
        }

        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data, time: formatTime() }
        ]);
        setNewMessages((prevNewMessages) => prevNewMessages + 1);
    };

    let sendMessage = () => {
        if (!message.trim()) return;

        // Optimistically add message
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: username, data: message, time: formatTime() }
        ]);

        socketRef.current.emit('chat-message', window.location.pathname, message, username);
        setMessage("");
    }

    let connect = () => {
        if (!username.trim()) {
            alert("Please enter a username to join.");
            return;
        }

        if (!roomId.trim()) {
            alert("Please enter a Room ID to join.");
            return;
        }

        // Check if Room ID has changed
        const currentPath = window.location.pathname.substring(1);
        if (roomId !== currentPath) {
            window.history.pushState(null, '', `/${roomId}`);
        }

        setAskForUsername(false);
        getMedia();
    }

    return (
        <div className={styles.wrapper}>
            {askForUsername === true ? (
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyCard}>
                        <h1>Join Meeting</h1>
                        <div className={styles.lobbyVideoPreview}>
                            <video ref={localVideoref} autoPlay muted></video>
                        </div>

                        <div className={styles.lobbyForm}>
                            <TextField
                                id="outlined-basic"
                                label="Username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                variant="outlined"
                                fullWidth
                                error={!username && false}
                                helperText={!username ? "Required" : ""}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                        "&:hover fieldset": { borderColor: "white" },
                                        "&.Mui-focused fieldset": { borderColor: "white" }
                                    },
                                    "& .MuiInputBase-input": { color: "white" },
                                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                                    "& .MuiInputLabel-root.Mui-focused": { color: "white" }
                                }}
                            />
                            <TextField
                                id="outlined-room"
                                label="Room ID"
                                value={roomId}
                                onChange={e => setRoomId(e.target.value)}
                                variant="outlined"
                                fullWidth
                                sx={{
                                    marginTop: '15px',
                                    "& .MuiOutlinedInput-root": {
                                        "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                        "&:hover fieldset": { borderColor: "white" },
                                        "&.Mui-focused fieldset": { borderColor: "white" }
                                    },
                                    "& .MuiInputBase-input": { color: "white" },
                                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                                    "& .MuiInputLabel-root.Mui-focused": { color: "white" }
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={connect}
                                className="btn-primary"
                                style={{
                                    marginTop: '20px',
                                    width: '100%'
                                }}
                            >
                                Connect
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>

                    {/* Controls Dock */}
                    <div className={styles.buttonContainers}>

                        <div className={styles.roomIdBadge}>
                            Room: {roomId}
                        </div>

                        <Tooltip title={video ? "Turn Off Video" : "Turn On Video"}>
                            <IconButton onClick={handleVideo} className={styles.iconButton} style={{ color: video ? "white" : "#ff2d55" }}>
                                {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={audio ? "Mute Mic" : "Unmute Mic"}>
                            <IconButton onClick={handleAudio} className={styles.iconButton} style={{ color: audio ? "white" : "#ff2d55" }}>
                                {audio === true ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                        </Tooltip>

                        {screenAvailable === true && (
                            <Tooltip title={screen ? "Stop Sharing" : "Share Screen"}>
                                <IconButton onClick={handleScreen} className={styles.iconButton} style={{ color: screen ? "#ff2d55" : "white" }}>
                                    {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Chat">
                            <Badge badgeContent={newMessages} max={99} color='error'>
                                <IconButton onClick={() => setModal(!showModal)} className={styles.iconButton} style={{ color: "white" }}>
                                    <ChatIcon />
                                </IconButton>
                            </Badge>
                        </Tooltip>

                        <Tooltip title="End Call">
                            <IconButton onClick={handleEndCall} className={styles.endCallButton} style={{ color: "#ff2d55", background: 'rgba(255, 45, 85, 0.15)' }}>
                                <CallEndIcon />
                            </IconButton>
                        </Tooltip>
                    </div>

                    {/* Unified Video Conference View */}
                    <div className={styles.conferenceView} data-participants={Math.min(videos.length + 1, 4)}>

                        {/* Local Video - Treated as part of the grid */}
                        <div className={styles.videoWrapper}>
                            <video
                                className={styles.meetUserVideo}
                                ref={localVideoref}
                                autoPlay
                                muted
                                style={{ transform: 'scaleX(-1)' }}
                            ></video>
                            <div className={styles.nameTag}><span style={{ color: '#ff2d55' }}>You</span> ({username})</div>
                        </div>

                        {/* Remote Videos */}
                        {videos.slice(0, 3).map((video, index) => {
                            const totalParticipants = videos.length + 1;
                            const isLastVisible = index === 2;
                            const extraCount = totalParticipants - 4;

                            return (
                                <div key={video.socketId} className={styles.videoWrapper}>
                                    <video
                                        data-socket={video.socketId}
                                        ref={ref => {
                                            if (ref && video.stream) {
                                                ref.srcObject = video.stream;
                                            }
                                        }}
                                        autoPlay
                                    >
                                    </video>
                                    <div className={styles.nameTag}>{video.username || "Guest"}</div>
                                    
                                    {(totalParticipants > 4 && isLastVisible) && (
                                        <div className={styles.moreParticipantsBadge}>
                                            +{extraCount} other{extraCount > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Chat Room */}
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatHeader}>
                                <h3>Chat</h3>
                                <IconButton onClick={() => setModal(false)} style={{ color: "white" }} size="small">
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            <div className={styles.chattingDisplay}>
                                {messages.map((item, index) => {
                                    const isSystem = item.sender === "System";
                                    if (isSystem) {
                                        return (
                                            <div key={index} className={styles.systemMessage}>
                                                <p>{item.data}</p>
                                            </div>
                                        )
                                    }

                                    const isSelf = item.sender === username;
                                    return (
                                        <div key={index} className={`${styles.chatBubble} ${isSelf ? styles.sent : styles.received}`}>
                                            <span className={styles.senderName}>{item.sender}</span>
                                            <p className={styles.messageContent}>{item.data}</p>
                                            <span className={styles.timestamp}>{item.time}</span>
                                        </div>
                                    )
                                })}
                                <div ref={chatEndRef} />
                            </div>
                            {isTyping && <div className={styles.typingIndicator}>Someone is typing...</div>}

                            <div className={styles.chattingArea}>
                                <TextField
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                            "&:hover fieldset": { borderColor: "white" },
                                            "&.Mui-focused fieldset": { borderColor: "white" },
                                            borderRadius: '20px'
                                        },
                                        "& .MuiInputBase-input": { color: "white" }
                                    }}
                                />
                                <IconButton onClick={sendMessage} style={{ color: "#ff2d55" }}>
                                    <ChatIcon />
                                </IconButton>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}