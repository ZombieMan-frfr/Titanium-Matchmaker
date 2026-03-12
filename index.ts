import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";

// Start listening websocket on port
const port = 80;
const wss = new WebSocketServer({ port });

wss.on("listening", () => {
    console.log(`Matchmaker started listening on port ${port}`);
});

wss.on("connection", async (ws: WebSocket, req) => {
    const protocol = req.headers["sec-websocket-protocol"] ?? "";

    if (protocol.toLowerCase().includes("xmpp")) {
        ws.close();
        return;
    }

    // create hashes
    const ticketId = crypto.createHash("md5").update(`1${Date.now()}`).digest("hex");
    const matchId = crypto.createHash("md5").update(`2${Date.now()}`).digest("hex");
    const sessionId = crypto.createHash("md5").update(`3${Date.now()}`).digest("hex");

    // timed websocket messages
    setTimeout(Connecting, 200);
    setTimeout(Waiting, 1000);
    setTimeout(Queued, 2000);
    setTimeout(SessionAssignment, 6000);
    setTimeout(Join, 8000);

    function Connecting() {
        ws.send(JSON.stringify({
            payload: {
                state: "Connecting to Titanium"
            },
            name: "StatusUpdate"
        }));
    }

    function Waiting() {
        ws.send(JSON.stringify({
            payload: {
                totalPlayers: 1,
                connectedPlayers: 1,
                state: "Waiting"
            },
            name: "StatusUpdate"
        }));
    }

    function Queued() {
        ws.send(JSON.stringify({
            payload: {
                ticketId,
                queuedPlayers: 0,
                estimatedWaitSec: 0,
                status: {},
                state: "Queued"
            },
            name: "StatusUpdate"
        }));
    }

    function SessionAssignment() {
        ws.send(JSON.stringify({
            payload: {
                matchId,
                state: "SessionAssignment"
            },
            name: "StatusUpdate"
        }));
    }

    function Join() {
        ws.send(JSON.stringify({
            payload: {
                matchId,
                sessionId,
                joinDelaySec: 1
            },
            name: "Play"
        }));
    }
});