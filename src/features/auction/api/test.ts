import api from "../../../shared/api/api";

// get 예
const getTest = async () => {
  try {
    const res = await api.get("/api/users"); // 실제론 http://localhost:8080/users 로 전달
    console.log(res.data);
  } catch (err) {
    console.error(err);
  }
};

// post 예
const postTest = async () => {
  try {
    const res = await api.post("/api/users", { name: "홍길동", age: 25 });
    console.log(res.data);
  } catch (err) {
    console.error(err);
  }
};
