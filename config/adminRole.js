// import AdminRole from "../models/AdminRoleSchema.js";

// export const createAdminRole = async () => {
//   try {
//     const superAdminRole = new AdminRole({
//       role: " Super Admin",
//       Permissions: ["Manage Users", "Manage Bookings", "Manage Services"],
//     });
//     const userManagerRole = new AdminRole({
//       role: " User Manager",
//       Permissions: "Manage Users",
//     });
//     const serviceManagerRole = new AdminRole({
//       role: " Service Manager",
//       Permissions: "Manage Services",
//     });
//     await superAdminRole.save();
//     await userManagerRole.save();
//     await serviceManagerRole.save();

//     console.log("Adminrole created succssfully", AdminRole);
//   } catch (error) {
//     console.log("Adminrole is not Created due to some error", error);
//   }
// };
// createAdminRole();
