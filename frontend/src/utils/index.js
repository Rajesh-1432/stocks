import { jwtDecode } from "jwt-decode";
export const token_decode = (token) => {
  if (token) {
    const decode_data = jwtDecode(token);
    return decode_data;
  } else {
    return "";
  }
};
