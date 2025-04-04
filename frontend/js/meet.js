document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const videoGrid = document.getElementById('video-grid');
    const localVideoContainer = document.getElementById('local-video-container');
    const localVideo = document.getElementById('local-video');
    const muteBtn = document.getElementById('mute-btn');
    const videoBtn = document.getElementById('video-btn');
    const shareBtn = document.getElementById('share-btn');
    const chatBtn = document.getElementById('chat-btn');
    const participantsBtn = document.getElementById('participants-btn');
    const leaveBtn = document.getElementById('leave-btn');
    const chatbox = document.querySelector('.chatbox');
    const participantsList = document.querySelector('.participants-list');
    const chatBody = document.querySelector('.chat-body');
    const chatInput = document.querySelector('.chat-input input');
    const chatSendButton = document.querySelector('.chat-input button');
    const chatCloseButton = document.getElementById('chat-close');
    const participantsCloseButton = document.getElementById('participants-close');

    // State variables
    let localStream;
    let screenStream;
    let isMuted = false;
    let isVideoOff = false;
    let isScreenSharing = false;
    let peerConnections = {};
    let currentUser = {
        id: Math.random().toString(36).substring(2, 15),
        name: prompt('Enter your name:') || 'Anonymous'
    };

    // Initialize Socket.io connection
    const socket = io('http://localhost:3000');

    // Initialize PeerJS
    const peer = new Peer(currentUser.id);

    // Initialize local video stream
    async function initializeLocalStream() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            localVideo.srcObject = localStream;
            localVideo.addEventListener('loadedmetadata', () => {
                localVideo.play();
            });
        } catch (error) {
            console.error('Error accessing media devices:', error);
            alert('Unable to access camera or microphone. Please check permissions.');
        }
    }

    // Socket.io event handlers
    socket.on('connect', () => {
        console.log('Connected to server');
        // Add current user to participants list immediately
        addParticipant(currentUser.id, currentUser.name);
        
        // Join room
        socket.emit('join-room', {
            roomId: getRoomId(),
            userId: currentUser.id,
            userName: currentUser.name
        });
    });

    socket.on('user-joined', (data) => {
        console.log('User joined:', data);
        // Add the new participant to the list
        addParticipant(data.userId, data.userName);
        connectToNewUser(data.userId);
    });

    socket.on('user-left', (userId) => {
        console.log('User left:', userId);
        removeParticipant(userId);
        if (peerConnections[userId]) {
            peerConnections[userId].close();
            delete peerConnections[userId];
        }
        const videoElement = document.getElementById(`video-${userId}`);
        if (videoElement) {
            videoElement.remove();
        }
    });

    // PeerJS event handlers
    peer.on('open', (id) => {
        console.log('My peer ID is:', id);
    });

    peer.on('call', (call) => {
        call.answer(localStream);
        call.on('stream', (remoteStream) => {
            addVideoStream(remoteStream, call.peer);
        });
        peerConnections[call.peer] = call;
    });

    // Add video stream to grid
    function addVideoStream(stream, userId) {
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        videoContainer.id = `video-${userId}`;
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        
        const label = document.createElement('div');
        label.className = 'video-label';
        label.textContent = userId === currentUser.id ? 'You' : userId;
        
        videoContainer.appendChild(video);
        videoContainer.appendChild(label);
        videoGrid.appendChild(videoContainer);

        video.addEventListener('loadedmetadata', () => {
            video.play();
        });
    }

    // Connect to new user
    function connectToNewUser(userId) {
        const call = peer.call(userId, localStream);
        call.on('stream', (remoteStream) => {
            addVideoStream(remoteStream, userId);
        });
        peerConnections[userId] = call;
    }

    // Add participant to list
    function addParticipant(userId, userName) {
        console.log('Adding participant:', userId, userName); // Debug log
        
        // Check if participants body exists
        const participantsBody = document.querySelector('.participants-body');
        if (!participantsBody) {
            console.error('Participants body not found');
            return;
        }

        // Check if participant already exists
        const existingParticipant = document.getElementById(`participant-${userId}`);
        if (existingParticipant) {
            console.log('Participant already exists:', userId);
            return;
        }

        const participantItem = document.createElement('div');
        participantItem.className = 'participant-item';
        participantItem.id = `participant-${userId}`;
        
        const status = document.createElement('div');
        status.className = 'status online';
        
        const name = document.createElement('span');
        name.textContent = userId === currentUser.id ? `${currentUser.name} (You)` : userName || 'Anonymous';
        
        participantItem.appendChild(status);
        participantItem.appendChild(name);
        participantsBody.appendChild(participantItem);

        // Update participant count
        updateParticipantCount();

        // Make participants list visible if this is the first participant
        if (participantsList && document.querySelectorAll('.participant-item').length === 1) {
            participantsList.classList.add('active');
        }
    }

    // Remove participant from list
    function removeParticipant(userId) {
        const participant = document.getElementById(`participant-${userId}`);
        if (participant) {
            participant.remove();
            updateParticipantCount();
        }
    }

    // Update participant count in header
    function updateParticipantCount() {
        const count = document.querySelectorAll('.participant-item').length;
        const header = document.querySelector('.participants-header h3');
        if (header) {
            header.textContent = `Participants (${count})`;
        }
    }

    // Get room ID from URL
    function getRoomId() {
        return window.location.pathname.split('/').pop();
    }

    // Control button event handlers
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });
        muteBtn.innerHTML = isMuted ? '<i class="fas fa-microphone-slash"></i>' : '<i class="fas fa-microphone"></i>';
    });

    videoBtn.addEventListener('click', () => {
        isVideoOff = !isVideoOff;
        localStream.getVideoTracks().forEach(track => {
            track.enabled = !isVideoOff;
        });
        videoBtn.innerHTML = isVideoOff ? '<i class="fas fa-video-slash"></i>' : '<i class="fas fa-video"></i>';
    });

    shareBtn.addEventListener('click', async () => {
        if (!isScreenSharing) {
            try {
                screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const videoTrack = screenStream.getVideoTracks()[0];
                videoTrack.onended = () => {
                    stopScreenSharing();
                };
                replaceVideoTrack(videoTrack);
                isScreenSharing = true;
                shareBtn.innerHTML = '<i class="fas fa-stop"></i>';
            } catch (error) {
                console.error('Error sharing screen:', error);
            }
        } else {
            stopScreenSharing();
        }
    });

    function stopScreenSharing() {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            const videoTrack = localStream.getVideoTracks()[0];
            replaceVideoTrack(videoTrack);
        }
        isScreenSharing = false;
        shareBtn.innerHTML = '<i class="fas fa-desktop"></i>';
    }

    function replaceVideoTrack(newTrack) {
        const oldTrack = localVideo.srcObject.getVideoTracks()[0];
        localVideo.srcObject.removeTrack(oldTrack);
        localVideo.srcObject.addTrack(newTrack);
        
        // Replace track in all peer connections
        Object.values(peerConnections).forEach(pc => {
            const sender = pc.peerConnection.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
                sender.replaceTrack(newTrack);
            }
        });
    }

    // Chat functionality
    chatBtn.addEventListener('click', () => {
        chatbox.classList.toggle('active');
        participantsList.classList.remove('active');
        if (chatbox.classList.contains('active')) {
            chatInput.focus();
        }
    });

    chatCloseButton.addEventListener('click', () => {
        chatbox.classList.remove('active');
    });

    participantsBtn.addEventListener('click', () => {
        const participantsList = document.querySelector('.participants-list');
        if (participantsList) {
            participantsList.classList.toggle('active');
            chatbox.classList.remove('active');
            
            // If opening the participants list, ensure current user is listed
            if (participantsList.classList.contains('active') && 
                !document.getElementById(`participant-${currentUser.id}`)) {
                addParticipant(currentUser.id, currentUser.name);
            }
        }
    });

    participantsCloseButton.addEventListener('click', () => {
        participantsList.classList.remove('active');
    });

    chatSendButton.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            socket.emit('chat-message', {
                roomId: getRoomId(),
                userId: currentUser.id,
                userName: currentUser.name,
                message: message,
                timestamp: new Date().toISOString()
            });

            addMessageToChat({
                sender: currentUser.name,
                message,
                timestamp: new Date().toISOString(),
                isSent: true
            });

            chatInput.value = '';
            chatInput.focus();
        }
    }

    socket.on('chat-message', (data) => {
        if (data.userId !== currentUser.id) {
            addMessageToChat({
                sender: data.userName,
                message: data.message,
                timestamp: data.timestamp,
                isSent: false
            });
        }
    });

    function addMessageToChat({ sender, message, timestamp, isSent }) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isSent ? 'sent' : 'received'}`;
        
        const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-sender">${sender}</div>
            <div class="message-content">${message}</div>
            <div class="message-time">${time}</div>
        `;
        
        chatBody.appendChild(messageElement);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Leave meeting
    leaveBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to leave the meeting?')) {
            socket.emit('leave-room', {
                roomId: getRoomId(),
                userId: currentUser.id
            });
            
            // Stop all tracks
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
            
            // Close all peer connections
            Object.values(peerConnections).forEach(pc => pc.close());
            
            // Disconnect socket and peer
            socket.disconnect();
            peer.destroy();
            
            // Redirect to home
            window.location.href = '/';
        }
    });

    // Initialize the meeting
    initializeLocalStream();
});

