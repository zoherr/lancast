const socket = io();
let peerConnection;
let dataChannel;
let currentActivePeer = null;

const config = {
    iceServers: [
        
    ]
};

const statusEl = document.getElementById('status');
const usersListEl = document.getElementById('users-list');
const networkZone = document.getElementById('network-zone');
const transferZone = document.getElementById('transfer-zone');
const fileInput = document.getElementById('file-input');
const progressContainer = document.getElementById('progress-container');
const fileProgress = document.getElementById('file-progress');
const progressText = document.getElementById('progress-text');
const receivedFilesList = document.getElementById('received-files');

const requestModal = document.getElementById('request-modal');
const requesterIdEl = document.getElementById('requester-id');
const acceptBtn = document.getElementById('accept-btn');
const rejectBtn = document.getElementById('reject-btn');
const disconnectBtn = document.getElementById('disconnect-btn');

let receiveBuffer = [];
let receivedSize = 0;
let expectedFileSize = 0;
let expectedFileName = '';
let pendingRequester = null;

function updateStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? 'var(--danger)' : 'var(--primary)';
    statusEl.style.background = isError ? '#ffebee' : '#eef2ff';
}

socket.on('connect', () => {
    updateStatus(`My ID: ${socket.id.substring(0, 5)}`);
});

socket.on('update-user-list', (users) => {
    usersListEl.innerHTML = '';
    const otherUsers = users.filter(u => u.id !== socket.id);

    if (otherUsers.length === 0) {
        usersListEl.innerHTML = '<p style="color: #666; font-size: 0.9rem;">No other devices on network.</p>';
        return;
    }

    otherUsers.forEach(user => {
        const btn = document.createElement('button');
        btn.className = 'user-btn';
        btn.innerHTML = `<span>📱 Device_${user.id.substring(0, 5)}</span> <span>Connect →</span>`;
        btn.onclick = () => sendConnectionRequest(user.id);
        usersListEl.appendChild(btn);
    });
});

function sendConnectionRequest(targetId) {
    updateStatus(`Sending request to Device_${targetId.substring(0, 5)}...`);
    socket.emit('connection-request', { to: targetId });
}

socket.on('connection-request', (data) => {
    if (currentActivePeer) {
        socket.emit('connection-response', { to: data.from, accepted: false });
        return;
    }
    pendingRequester = data.from;
    requesterIdEl.textContent = `Device_${data.from.substring(0, 5)}`;
    requestModal.style.display = 'flex';
});

acceptBtn.onclick = () => {
    requestModal.style.display = 'none';
    socket.emit('connection-response', { to: pendingRequester, accepted: true });
    updateStatus(`Accepted request. Establishing connection...`);
};

rejectBtn.onclick = () => {
    requestModal.style.display = 'none';
    socket.emit('connection-response', { to: pendingRequester, accepted: false });
    pendingRequester = null;
    updateStatus(`My ID: ${socket.id.substring(0, 5)}`);
};

socket.on('connection-response', async (data) => {
    if (data.accepted) {
        updateStatus(`Request accepted! Connecting to Device_${data.from.substring(0, 5)}...`);
        await initiateWebRTCConnection(data.from);
    } else {
        updateStatus(`Device_${data.from.substring(0, 5)} rejected your request.`, true);
        setTimeout(() => updateStatus(`My ID: ${socket.id.substring(0, 5)}`), 3000);
    }
});

function setupPeerConnection(targetId) {
    peerConnection = new RTCPeerConnection(config);
    currentActivePeer = targetId;

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { to: targetId, candidate: event.candidate });
        }
    };

    peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
            updateStatus(`🟢 Connected to Device_${targetId.substring(0, 5)}`);
            networkZone.style.display = 'none';
            transferZone.style.display = 'block';
        } else if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
            handleDisconnection(false); 
        }
    };

    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupDataChannel();
    };
}

function handleDisconnection(notifyPeer = true) {
    if (notifyPeer && currentActivePeer) {
        socket.emit('peer-disconnected', { to: currentActivePeer });
    }

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    currentActivePeer = null;
    dataChannel = null;
    networkZone.style.display = 'block';
    transferZone.style.display = 'none';
    updateStatus(`My ID: ${socket.id.substring(0, 5)}`);
}

disconnectBtn.onclick = () => handleDisconnection(true);

function setupDataChannel() {
    dataChannel.binaryType = 'arraybuffer';

    dataChannel.onmessage = (event) => {
        if (typeof event.data === 'string') {
            const metadata = JSON.parse(event.data);
            expectedFileName = metadata.name;
            expectedFileSize = metadata.size;
            receiveBuffer = [];
            receivedSize = 0;
            progressContainer.style.display = 'block';
        } else {
            receiveBuffer.push(event.data);
            receivedSize += event.data.byteLength;

            const percentage = Math.round((receivedSize / expectedFileSize) * 100);
            fileProgress.value = percentage;
            progressText.textContent = `Receiving: ${percentage}%`;

            if (receivedSize === expectedFileSize) {
                const blob = new Blob(receiveBuffer);
                const downloadUrl = URL.createObjectURL(blob);
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = expectedFileName;
                a.textContent = `💾 ${expectedFileName}`;
                li.appendChild(a);
                receivedFilesList.appendChild(li);

                progressText.textContent = 'Complete!';
                setTimeout(() => progressContainer.style.display = 'none', 2000);
            }
        }
    };
}

async function initiateWebRTCConnection(targetId) {
    setupPeerConnection(targetId);
    dataChannel = peerConnection.createDataChannel('fileTransfer');
    setupDataChannel();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('offer', { to: targetId, offer: offer });
}

socket.on('offer', async (data) => {
    setupPeerConnection(data.sender);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { to: data.sender, answer: answer });
});

socket.on('answer', async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on('ice-candidate', async (data) => {
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (e) {
        console.error(e);
    }
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file || !dataChannel || dataChannel.readyState !== 'open') return;

    dataChannel.send(JSON.stringify({ name: file.name, size: file.size }));

    const chunkSize = 16384;
    let offset = 0;

    progressContainer.style.display = 'block';

    const readSlice = (o) => {
        const slice = file.slice(offset, o + chunkSize);
        const reader = new FileReader();

        reader.onload = (e) => {
            dataChannel.send(e.target.result);
            offset += chunkSize;

            const percentage = Math.round((offset / file.size) * 100);
            fileProgress.value = Math.min(percentage, 100);
            progressText.textContent = `Sending: ${Math.min(percentage, 100)}%`;

            if (offset < file.size) {
                if (dataChannel.bufferedAmount > 65535) {
                    dataChannel.onbufferedamountlow = () => {
                        dataChannel.onbufferedamountlow = null;
                        readSlice(offset);
                    };
                } else {
                    readSlice(offset);
                }
            } else {
                progressText.textContent = 'Sent!';
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    fileInput.value = '';
                }, 2000);
            }
        };
        reader.readAsArrayBuffer(slice);
    };

    readSlice(0);
});

function handleDisconnection() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    currentActivePeer = null;
    dataChannel = null;
    networkZone.style.display = 'block';
    transferZone.style.display = 'none';
    updateStatus(`My ID: ${socket.id.substring(0, 5)}`);
}

disconnectBtn.onclick = handleDisconnection;