export const verifyRoles = (...allowedRoles) =>{
  return (req, res, next) => {
    // console.log(req?.user?.roles || "No roles assigned");
    if (!req?.user?.roles) {
      return res.status(403).json({ message: "Access denied: No role assigned" });
    }

    // Normalize allowed roles to lowercase strings for case-insensitive comparison
    const allowed = allowedRoles.map((r) => String(r).toLowerCase());

  // Support roles stored as a single string or as an array on req.user.roles
  const userRoles = req.user.roles;
    const userRolesArray = Array.isArray(userRoles) ? userRoles : [userRoles];

    const normalizedUserRoles = userRolesArray.map((r) => String(r).toLowerCase());

    const hasAccess = normalizedUserRoles.some((r) => allowed.includes(r));

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied: Insufficient permissions" });
    }

    next();
  };
}