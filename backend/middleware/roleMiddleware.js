/**
 * Restricts a route to a specific set of roles.
 * Usage: router.get('/', protect, authorize('lecturer', 'admin'), handler)
 * Must run after `protect`, which attaches req.user.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, please log in');
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

module.exports = { authorize };
