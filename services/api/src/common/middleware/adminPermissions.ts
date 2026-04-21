import { AdminRole, UserRole } from "@prisma/client";

/**
 * Check if an admin can manage a user/resource within a specific scope
 */
export function canAdminManageResource(
  adminRole: AdminRole | null | undefined,
  adminSchoolId: string,
  adminCollegeId: string,
  adminDepartmentId: string,
  resourceSchoolId: string,
  resourceCollegeId?: string,
  resourceDepartmentId?: string
): boolean {
  if (!adminRole) return false;

  switch (adminRole) {
    case AdminRole.SUPER_ADMIN:
      // Super admin can manage everything
      return true;

    case AdminRole.UNIVERSITY_ADMIN:
      // University admin can only manage users/resources in their school
      return adminSchoolId === resourceSchoolId;

    case AdminRole.COLLEGE_ADMIN:
      // College admin can only manage users/resources in their college
      return adminSchoolId === resourceSchoolId && adminCollegeId === resourceCollegeId;

    case AdminRole.DEPARTMENT_ADMIN:
      // Department admin can only manage users/resources in their department
      return (
        adminSchoolId === resourceSchoolId &&
        adminCollegeId === resourceCollegeId &&
        adminDepartmentId === resourceDepartmentId
      );

    default:
      return false;
  }
}

/**
 * Get the maximum admin role that a user can create
 * A SUPER_ADMIN can create any admin role
 * A UNIVERSITY_ADMIN can create COLLEGE_ADMIN or DEPARTMENT_ADMIN
 * A COLLEGE_ADMIN can create DEPARTMENT_ADMIN
 * A DEPARTMENT_ADMIN cannot create any admins
 */
export function getMaxCreatableAdminRole(actorAdminRole: AdminRole | null | undefined): AdminRole[] {
  if (!actorAdminRole) return [];

  switch (actorAdminRole) {
    case AdminRole.SUPER_ADMIN:
      return [AdminRole.SUPER_ADMIN, AdminRole.UNIVERSITY_ADMIN, AdminRole.COLLEGE_ADMIN, AdminRole.DEPARTMENT_ADMIN];

    case AdminRole.UNIVERSITY_ADMIN:
      return [AdminRole.COLLEGE_ADMIN, AdminRole.DEPARTMENT_ADMIN];

    case AdminRole.COLLEGE_ADMIN:
      return [AdminRole.DEPARTMENT_ADMIN];

    case AdminRole.DEPARTMENT_ADMIN:
      return [];

    default:
      return [];
  }
}

/**
 * Determine the admin role based on the hierarchy level being assigned
 */
export function getAdminRoleForHierarchy(
  collegeId?: string,
  departmentId?: string,
  departmentLevelId?: string
): AdminRole {
  // If all hierarchy fields are provided, this is a department-level admin
  if (collegeId && departmentId && departmentLevelId) {
    return AdminRole.DEPARTMENT_ADMIN;
  }
  // If college and department are provided, this is a department-level admin
  if (collegeId && departmentId) {
    return AdminRole.DEPARTMENT_ADMIN;
  }
  // If only college is provided, this is a college-level admin
  if (collegeId) {
    return AdminRole.COLLEGE_ADMIN;
  }
  // No hierarchy specified, this is a university-level admin
  return AdminRole.UNIVERSITY_ADMIN;
}
