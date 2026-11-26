import path from "node:path";
import { pathToFileURL } from "node:url";
import cors from "cors";
import express from "express";
import { migrate } from "./db.js";
import {
  AREAS,
  AREA_LABELS,
  RENTAL_CATEGORIES,
  SERVICE_TYPES,
  STATUSES,
  STATUS_LABELS,
} from "./leadWorkflow.js";
import {
  cancelLead,
  convertLead,
  createLead,
  dashboard,
  getLead,
  listFollowUps,
  listLeads,
  listVehicles,
  scheduleFollowUp,
} from "./leadsRepo.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "mas-leads", city: "Muscat", currency: "OMR" });
  });

  app.get("/api/meta", (_req, res) => {
    res.json({
      country: "Oman",
      city: "Muscat",
      currency: "OMR",
      areas: AREAS.map((id) => ({ id, label: AREA_LABELS[id] })),
      statuses: STATUSES.map((id) => ({ id, label: STATUS_LABELS[id] })),
      serviceTypes: SERVICE_TYPES,
      rentalCategories: RENTAL_CATEGORIES,
    });
  });

  app.get("/api/dashboard", async (_req, res, next) => {
    try {
      res.json(await dashboard());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/vehicles", async (req, res, next) => {
    try {
      res.json(await listVehicles(req.query.purpose));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/leads", async (req, res, next) => {
    try {
      res.json(await listLeads({ status: req.query.status, area: req.query.area, q: req.query.q }));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/leads/follow-ups", async (_req, res, next) => {
    try {
      res.json(await listFollowUps());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/leads/:id", async (req, res, next) => {
    try {
      const lead = await getLead(Number(req.params.id));
      if (!lead) return res.status(404).json({ error: "Lead not found." });
      res.json(lead);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/leads", async (req, res, next) => {
    try {
      res.status(201).json(await createLead(req.body));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/leads/:id/follow-up", async (req, res, next) => {
    try {
      res.json(await scheduleFollowUp(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/leads/:id/cancel", async (req, res, next) => {
    try {
      res.json(await cancelLead(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/leads/:id/convert", async (req, res, next) => {
    try {
      res.json(await convertLead(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    res.status(status).json({
      error: status >= 500 ? "Something went wrong while saving the lead." : error.message,
      fields: error.fields || undefined,
    });
  });

  return app;
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) {
  const port = Number(process.env.PORT || 4000);
  await migrate();
  createApp().listen(port, () => {
    console.log(`MAS leads API listening on http://localhost:${port}`);
  });
}
