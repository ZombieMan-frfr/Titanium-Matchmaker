import { WebSocketServer, WebSocket } from "ws"
import crypto from "crypto"
import fs from "fs"
import path from "path"

interface MatchState {
    ticketId: string
    matchId: string
    sessionId: string
    playlistName: string
    region: string
    buildId: string
    season: number
    chapter: number
    backendVersion: string
}

interface StatusUpdatePayload {
    state: string
    totalPlayers?: number
    connectedPlayers?: number
    ticketId?: string
    queuedPlayers?: number
    estimatedWaitSec?: number
    status?: Record<string, unknown>
    matchId?: string
    playlistName?: string
    region?: string
    buildId?: string
    season?: number
    chapter?: number
    backendVersion?: string
}

interface PlayPayload {
    matchId: string
    sessionId: string
    joinDelaySec: number
    playlistName: string
    region: string
    buildId: string
    season: number
    chapter: number
    backendVersion: string
}

const STATE_FILE: string = path.join(process.cwd(), "titanium_state.json")

function generateId(prefix: string): string {
    return crypto.createHash("md5").update(prefix + Date.now() + Math.random()).digest("hex")
}

function loadState(): MatchState {
    if (fs.existsSync(STATE_FILE)) {
        try {
            const raw: string = fs.readFileSync(STATE_FILE, "utf-8")
            const parsed: MatchState = JSON.parse(raw)
            if (parsed.matchId && parsed.sessionId && parsed.ticketId) {
                return parsed
            }
        } catch {}
    }

    const newState: MatchState = {
        ticketId: generateId("ticket"),
        matchId: generateId("match"),
        sessionId: generateId("session"),
        playlistName: "Playlist_ShowdownAlt_Solo",
        region: "NAE",
        buildId: "Titanium-Backend-1.0.0",
        season: 30,
        chapter: 5,
        backendVersion: "Titanium-MM-1.0.0"
    }

    saveState(newState)
    return newState
}

function saveState(state: MatchState): void {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8")
}

let globalMatchState: MatchState = loadState()

function rotateMatchState(): void {
    globalMatchState = {
        ticketId: generateId("ticket"),
        matchId: generateId("match"),
        sessionId: generateId("session"),
        playlistName: globalMatchState.playlistName,
        region: globalMatchState.region,
        buildId: globalMatchState.buildId,
        season: globalMatchState.season,
        chapter: globalMatchState.chapter,
        backendVersion: globalMatchState.backendVersion
    }
    saveState(globalMatchState)
    console.log("Rotated match state:", globalMatchState)
}

const port: number = 80
const wss: WebSocketServer = new WebSocketServer({ port })

wss.on("listening", function () {
    console.log("Titanium Matchmaker started on port " + port)
    console.log("Loaded persistent match state:", globalMatchState)
})

wss.on("connection", function (ws: WebSocket, req) {
    const protocolHeader = req.headers["sec-websocket-protocol"]
    const protocol = Array.isArray(protocolHeader) ? protocolHeader.join(",") : protocolHeader || ""

    if (protocol.toLowerCase().includes("xmpp")) {
        ws.close()
        return
    }

    const state: MatchState = globalMatchState

    setTimeout(Connecting, 200)
    setTimeout(Waiting, 1000)
    setTimeout(Queued, 2000)
    setTimeout(SessionAssignment, 6000)
    setTimeout(Join, 8000)

    function sendStatusUpdate(payload: StatusUpdatePayload) {
        ws.send(JSON.stringify({ payload: payload, name: "StatusUpdate" }))
    }

    function Connecting() {
        sendStatusUpdate({
            state: "Connecting",
            playlistName: state.playlistName,
            region: state.region,
            buildId: state.buildId,
            season: state.season,
            chapter: state.chapter,
            backendVersion: state.backendVersion
        })
    }

    function Waiting() {
        sendStatusUpdate({
            state: "Waiting",
            totalPlayers: 1,
            connectedPlayers: 1,
            playlistName: state.playlistName,
            region: state.region,
            buildId: state.buildId,
            season: state.season,
            chapter: state.chapter,
            backendVersion: state.backendVersion
        })
    }

    function Queued() {
        sendStatusUpdate({
            state: "Queued",
            ticketId: state.ticketId,
            queuedPlayers: 0,
            estimatedWaitSec: 0,
            status: {},
            playlistName: state.playlistName,
            region: state.region,
            buildId: state.buildId,
            season: state.season,
            chapter: state.chapter,
            backendVersion: state.backendVersion
        })
    }

    function SessionAssignment() {
        sendStatusUpdate({
            state: "SessionAssignment",
            matchId: state.matchId,
            playlistName: state.playlistName,
            region: state.region,
            buildId: state.buildId,
            season: state.season,
            chapter: state.chapter,
            backendVersion: state.backendVersion
        })
    }

    function Join() {
        const payload: PlayPayload = {
            matchId: state.matchId,
            sessionId: state.sessionId,
            joinDelaySec: 1,
            playlistName: state.playlistName,
            region: state.region,
            buildId: state.buildId,
            season: state.season,
            chapter: state.chapter,
            backendVersion: state.backendVersion
        }

        ws.send(JSON.stringify({ payload: payload, name: "Play" }))
    }

    ws.on("close", function () {
        rotateMatchState()
    })
})

setInterval(function () {
    rotateMatchState()
}, 10 * 60 * 60 * 1000)
