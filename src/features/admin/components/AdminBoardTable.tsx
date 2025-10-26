import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../shared/api/axiosInstance";

const AdminBoardTable = () => {
  const [board, setBoard] = useState([]);
  const getBoardList = async () => {
    const resp = (await api.get("/auctions")).data;
    console.log(resp.data);
    setBoard(resp);

    const pages = resp.pagination;
    console.log(pages);
  };

  useEffect(() => {
    getBoardList();
  }, []);

  return (
    <div>
      <ul>
        {board.map((board, i) => (
          // 4) map 함수로 데이터 출력
          <li key={i}>
            <Link to={`/admin/${board}/${i}`}>{board}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminBoardTable;
