import "./load-env";
import NextAuth from "next-auth";

const result = NextAuth({
  providers: [],
});

console.log("NextAuth return keys:", Object.keys(result));
console.log("NextAuth return:", result);
