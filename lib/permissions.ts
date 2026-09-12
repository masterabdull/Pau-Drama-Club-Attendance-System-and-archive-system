export type AppRole = "SUPER_ADMIN" | "PRESIDENT" | "VICE_PRESIDENT" | "MUSICAL_THEATRE_HEAD" | "MUSIC_DIRECTOR" | "DRAMA_UNIT_HEAD" | "ASSISTANT_DRAMA_UNIT_HEAD" | "HEAD_OF_SCRIPTWRITERS" | "SECRETARY" | "PUBLICITY_AND_PROMOTIONS" | "HEAD_OF_HOUSE" | "HEAD_OF_STAGE_MANAGEMENT" | "ASSISTANT_STAGE_MANAGEMENT" | "TREASURER_AND_HEAD_OF_WELFARE" | "MEMBER";

export const roleLabels: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice President",
  MUSICAL_THEATRE_HEAD: "Musical Theatre Head",
  MUSIC_DIRECTOR: "Music Director",
  DRAMA_UNIT_HEAD: "Drama Unit Head",
  ASSISTANT_DRAMA_UNIT_HEAD: "Assistant Drama Unit Head",
  HEAD_OF_SCRIPTWRITERS: "Head of Scriptwriters",
  SECRETARY: "Secretary",
  PUBLICITY_AND_PROMOTIONS: "Publicity and Promotions",
  HEAD_OF_HOUSE: "Head of House",
  HEAD_OF_STAGE_MANAGEMENT: "Head of Stage Management",
  ASSISTANT_STAGE_MANAGEMENT: "Assistant Stage Management",
  TREASURER_AND_HEAD_OF_WELFARE: "Treasurer and Head of Welfare",
  MEMBER: "Member",
};

export const roleOptions = Object.keys(roleLabels) as AppRole[];
export const superAdminEmails = ["rajab.umar@pau.edu.ng", "masterabdulelumar@gmail.com"];

export function hasRole(role: string, allowed: AppRole[]) {
  return allowed.includes(role as AppRole);
}

export function canManageUsers(role: string) {
  return role === "SUPER_ADMIN";
}

export function isConfiguredSuperAdmin(email: string) {
  return superAdminEmails.includes(email.trim().toLowerCase());
}

export function canManageAttendance(role: string) {
  return hasRole(role, ["SUPER_ADMIN", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER_AND_HEAD_OF_WELFARE"]);
}

export function canManageArchive(role: string) {
  return hasRole(role, ["SUPER_ADMIN", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER_AND_HEAD_OF_WELFARE"]);
}

export function archiveScope(role: string): "all" | "musical" | "drama" | "publicity" | "drama-musical" | "public" {
  if (["SUPER_ADMIN", "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER_AND_HEAD_OF_WELFARE"].includes(role)) return "all";
  if (["MUSICAL_THEATRE_HEAD", "MUSIC_DIRECTOR"].includes(role)) return "musical";
  if (["DRAMA_UNIT_HEAD", "ASSISTANT_DRAMA_UNIT_HEAD"].includes(role)) return "drama";
  if (role === "HEAD_OF_SCRIPTWRITERS") return "drama-musical";
  if (role === "PUBLICITY_AND_PROMOTIONS") return "publicity";
  if (["HEAD_OF_HOUSE", "HEAD_OF_STAGE_MANAGEMENT", "ASSISTANT_STAGE_MANAGEMENT"].includes(role)) return "drama-musical";
  return "public";
}