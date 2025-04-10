import { createContext, useState } from "react";

const UserContext = createContext(null);

const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);

  return (
    <UserContext.Provider value={{ users, setUsers }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
