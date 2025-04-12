import { Logout } from "@/app/slices/auth";
// import { FetchAllUsers } from "@/app/slices/user";
import UserListItem from "@/components/custom/UserListItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/hooks/socket";
import { SignOut } from "phosphor-react";
import React, { memo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Home() {
  const { user } = useSelector((state) => state.auth);
  const { users, activeUsers } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { socket } = useSocket();
  useEffect(() => {
    document.title = "Home | Video Chat App";
  }, []);

  console.log("Home component rendered");

  return (
    <div className="h-full w-full flex  items-center justify-center overflow-hidden">
      <div className="h-full w-full sm:w-8/12 flex flex-col items-center bg-slate-200">
        <header className="w-full h-14 py-2  flex items-center  justify-between px-4">
          <div className="shaddow-md py-2 px-4 bg-white rounded-md">
            <div className="flex items-center justify-center gap-2 h-full">
              <div className="h-6 w-6 rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src={user?.avatar}
                  alt="av"
                  className="w-full object-center object-cover"
                  loading="lazy"
                />
              </div>
              <span className="sm:inline-block hidden ">{user?.name}</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="flex items-center h-10 w-10 justify-center p-3  hover:bg-slate-100 rounded-full active:bg-slate-200 cursor-pointer"
            onClick={() => {
              dispatch(Logout());
              socket?.disconnect();
            }}
          >
            <SignOut
              size={20}
              color="red"
              weight="fill"
              className="cursor-pointer"
            />
          </Button>
        </header>
        <div className="w-full h-[72px] flex items-center justify-center">
          <div className="flex items-center p-4 justify-center gap-2 w-full sm:w-10/12">
            <Input
              className={"bg-white h-10 "}
              type="email"
              placeholder="Search People"
            />
            <Button type="submit" className={"leading-none"}>
              Search
            </Button>
          </div>
        </div>
        <Tabs defaultValue="active" className="w-full flex-grow bg-slate-100">
          <div className="w-ful flex items-center px-2 bg-slate-200">
            <TabsList className={"px-2 mb-2 sm:w-[240px] w-full bg--white"}>
              <TabsTrigger className={"p-3"} value="active">
                Online Users
              </TabsTrigger>
              <TabsTrigger className={"p-3"} value="all">
                All Users
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="active">
            <div className="flex-grow w-full bg-slate-100 flex flex-col items-center justify-start gap-2 p-4">
              <ul className="w-full flex flex-col items-center gap-2 py-4">
                {activeUsers.map((userItem) => (
                  <UserListItem key={userItem._id} user={userItem} />
                ))}
              </ul>
            </div>
          </TabsContent>
          <TabsContent value="all">
            <div className="flex-grow w-full bg-slate-100 flex flex-col items-center justify-start gap-2 p-4">
              <ul className="w-full flex flex-col items-center gap-2 py-4">
                {users.map((userItem) => (
                  <UserListItem key={userItem._id} user={userItem} />
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className="h-full   sm:w-4/12 sm:block hidden  overflow-hidden">
        <img
          // src={user.avatar}
          src="https://images.unsplash.com/photo-1633113215883-a43e36bc6178?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="img"
          className="object-cover w-full h-full aspect-auto "
          loading="lazy"
        />
      </div>
    </div>
  );
}

export default memo(Home);
