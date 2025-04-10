import { combineReducers } from "redux";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/auth";
import userReducer from "./slices/user";
import callReducer from "./slices/call";

const rootPersistConfig = {
  key: "root",
  storage,
  keyPrefix: "redux-",
  whitelist: ["auth", "user", "call"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  call: callReducer,
});

export { rootReducer, rootPersistConfig };
