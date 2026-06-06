import React from "react";
import styles from "./pagination.module.scss";

const getVisiblePages = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return [...Array(totalPages)].map((_, index) => index + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push("start-ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("end-ellipsis");
  }

  pages.push(totalPages);

  return pages;
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className={styles.pagination}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Trước
      </button>

      {pages.map((page) => (
        typeof page === "number" ? (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={page === currentPage ? styles.active : ""}
          >
            {page}
          </button>
        ) : (
          <span
            key={page}
            className={styles.ellipsis}
          >
            ...
          </span>
        )
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Sau
      </button>
    </div>
  );
};

export default Pagination;
