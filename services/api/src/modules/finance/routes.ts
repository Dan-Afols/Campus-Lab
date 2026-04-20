import { Router } from "express";
import axios from "axios";
import { authMiddleware } from "../../common/middleware/auth.js";
import { prisma } from "../../common/lib/prisma.js";
import { env } from "../../common/config/env.js";

export const financeRouter = Router();

financeRouter.use(authMiddleware);

financeRouter.post("/expenses", async (req, res) => {
  const created = await prisma.expense.create({
    data: {
      userId: req.user!.id,
      amount: Number(req.body.amount),
      category: req.body.category,
      description: req.body.description,
      spentAt: new Date(req.body.spentAt),
      receiptUrl: req.body.receiptUrl
    }
  });
  return res.status(201).json(created);
});

financeRouter.get("/expenses", async (req, res) => {
  const items = await prisma.expense.findMany({ where: { userId: req.user!.id }, orderBy: { spentAt: "desc" } });
  return res.json(items);
});

financeRouter.post("/savings-goals", async (req, res) => {
  const created = await prisma.savingsGoal.create({
    data: {
      userId: req.user!.id,
      goalName: req.body.goalName,
      targetAmount: Number(req.body.targetAmount),
      targetDate: new Date(req.body.targetDate)
    }
  });
  return res.status(201).json(created);
});

financeRouter.post("/savings-goals/:id/deposits", async (req, res) => {
  const created = await prisma.savingsDeposit.create({
    data: {
      userId: req.user!.id,
      savingsGoalId: req.params.id,
      amount: Number(req.body.amount),
      depositedAt: new Date(req.body.depositedAt)
    }
  });
  return res.status(201).json(created);
});

financeRouter.get("/summary", async (req, res) => {
  const expenses = await prisma.expense.findMany({ where: { userId: req.user!.id } });
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const income = Number(req.query.monthlyIncome ?? 0);
  return res.json({ spent, income, remaining: income - spent });
});

financeRouter.post("/ai-meal-plan", async (req, res) => {
  const result = await axios.post(`${env.AI_SERVER_BASE_URL}/ai/chat`, {
    prompt: `Generate a practical Nigerian student meal plan for budget ${req.body.budget} with constraints: ${req.body.constraints ?? "none"}`
  });
  return res.json({ label: "AI Meal Suggestion", plan: result.data.answer });
});
