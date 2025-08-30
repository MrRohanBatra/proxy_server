import express from "express";
import { WebPortal } from "jsjiit";
import crypto from "crypto";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

// ✅ Minimal shim for browser APIs (jsjiit expects window.crypto)
if (typeof global.window === "undefined") global.window = {};
if (!global.window.crypto) {
    global.window.crypto = {
        subtle: crypto.webcrypto.subtle,
        getRandomValues: (arr) => crypto.webcrypto.getRandomValues(arr),
    };
}

const app = express();
app.use(express.json());

// ✅ Redis connection (BullMQ requires maxRetriesPerRequest=null)
const connection = new IORedis({
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
});

// ✅ Create queue
const attendanceQueue = new Queue("attendance", { connection });

// ✅ Worker that processes jobs
const worker = new Worker(
    "attendance",
    async (job) => {
        const { name, pass } = job.data;

        const portal = new WebPortal();

        // login
        await portal.student_login(name, pass);

        // fetch attendance
        const meta = await portal.get_attendance_meta();
        const attendance = await portal.get_attendance(
            meta.headers[0],
            meta.semesters[0]
        );

        return { user: name, attendance };
    },
    {
        connection,
        concurrency: 5, // ⚡ process up to 5 jobs in parallel
    }
);

// ✅ Route: enqueue a job
app.post("/", async (req, res) => {
    try {
        const { name, pass } = req.body;
        if (!name || !pass) {
            return res.status(400).json({ error: "Missing name or password" });
        }

        // Add job to queue
        const job = await attendanceQueue.add("fetchAttendance", { name, pass });

        res.json({
            message: "Job added",
            jobId: job.id,
        });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Route: check job status
app.get("/status/:id", async (req, res) => {
    try {
        const job = await attendanceQueue.getJob(req.params.id);
        if (!job) return res.status(404).json({ error: "Job not found" });

        const state = await job.getState(); // "waiting" | "active" | "completed" | "failed"
        const result = await job.returnvalue;

        res.json({ state, result });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Start server
app.listen(3000, () => {
    console.log("✅ Server running at http://localhost:3000");
});
