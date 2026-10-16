// Single source of truth for "is this role admin-like" — must stay in
// sync with the DB CHECK constraint on users_profile.role (see
// supabase/migrations/20240101000013_extend_role_vocabulary.sql and
// 20240101000017, which dropped 'member').
//
// Every place that compared a DATABASE-sourced role against the literal
// string "admin" broke the moment the first scoped role (province_admin)
// was actually assigned to a real account: login sent them to
// /student/home (exact-match check), which then immediately bounced them
// to /authenticate (its own exact-match check requires role === "student"
// exactly) — looking exactly like being logged out, even though the
// session was still valid the whole time. Every one of those call sites
// now goes through isAdminRole() instead of a literal string compare.
//
// NOT relevant to the signup form's role radio button (src/app/
// authenticate/page.jsx) or setSignupRoleData's validation (src/contexts/
// AuthContext.jsx) — those only ever handle "admin"/"student" by
// construction (a two-option radio input), never a scoped role.
export const ADMIN_ROLES = new Set([
	"admin",
	"super_admin",
	"province_admin",
	"zone_admin",
	"area_admin",
	"parish_admin",
]);

export const isAdminRole = (role) => ADMIN_ROLES.has(role);

// Human-readable labels for display (sidebar headers, activity logs,
// anywhere a raw role string shouldn't be shown directly to a user).
export const ROLE_LABELS = {
	admin: "Admin",
	super_admin: "Super Admin",
	province_admin: "Province Admin",
	zone_admin: "Zone Admin",
	area_admin: "Area Admin",
	parish_admin: "Parish Admin",
	student: "Student",
};

export const roleLabel = (role) => ROLE_LABELS[role] || role || "—";
