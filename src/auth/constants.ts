export const jwtConstants = {
  accessTokenSecret: process.env.SECRET_KEY,
  refreshTokenSecret: process.env.SECRET_KEY,
};

export const basicAuthConstants = {
  username: process.env.SUPER_LOGIN,
  password: process.env.SUPER_PASSWORD,
};
export const emailConstants = {
  username: process.env.MY_EMAIL,
  password: process.env.PASSWORD,
};
