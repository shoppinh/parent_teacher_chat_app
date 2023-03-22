import { ParTeRoleIdType, RoleNameType } from '../constant/role.constant';

export const printLog = (...message) => {
  if (process.env.DEBUG_MODE === 'true') {
    console.log(...message);
  }
};

export const mapStringRoleToNumber = (role: string): number => {
  switch (role) {
    case RoleNameType.SUPER_USER:
      return ParTeRoleIdType.ADMIN;
    case RoleNameType.TEACHER:
      return ParTeRoleIdType.TEACHER;
    case RoleNameType.PARENT:
      return ParTeRoleIdType.PARENT;
    default:
      return ParTeRoleIdType.PARENT;
  }
};
