import morgan from "morgan";
import logger from "../config/logger.js";

morgan.token("body", (req) => {
  if (req.method === "POST" || req.method === "PUT") {
    try {
      const body = { ...req.body };
      if (body.password) body.password = "[HIDDEN]";
      if (body.refreshToken) body.refreshToken = "[HIDDEN]";
      return JSON.stringify(body);
    } catch (e) {
      return "<unserializable>";
    }
  }
  return "";
});

const developmentFormat =
  ":method :url :status :res[content-length] - :response-time ms :body";

const productionFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

const requestLogger = morgan(
  process.env.NODE_ENV === "production" ? productionFormat : developmentFormat,
  {
    stream: {
      write: (message) => {
        logger.http(message.trim());
      },
    },
  }
);

export default requestLogger;
