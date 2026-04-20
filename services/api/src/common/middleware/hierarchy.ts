import { NextFunction, Request, Response } from "express";

export function enforceAcademicScope(req: Request, res: Response, next: NextFunction) {
  const scope = {
    schoolId: req.query.schoolId ?? req.body.schoolId,
    collegeId: req.query.collegeId ?? req.body.collegeId,
    departmentId: req.query.departmentId ?? req.body.departmentId,
    departmentLevelId: req.query.departmentLevelId ?? req.body.departmentLevelId
  };

  if (req.user?.role === "ADMIN") {
    return next();
  }

  if (
    (scope.schoolId && scope.schoolId !== req.user?.schoolId) ||
    (scope.collegeId && scope.collegeId !== req.user?.collegeId) ||
    (scope.departmentId && scope.departmentId !== req.user?.departmentId) ||
    (scope.departmentLevelId && scope.departmentLevelId !== req.user?.departmentLevelId)
  ) {
    return res.status(403).json({ error: "Scope violation" });
  }

  return next();
}
