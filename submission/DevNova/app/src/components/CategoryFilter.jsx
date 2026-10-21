
import styles from "./CategoryFilter.module.css";

const categories = [
  "All",
  "Web Development",
  "Graphic Design",
  "Content Writing",
  "Tutoring",
  "Video Editing",
  "Marketing",
];

function CategoryFilter({ selected = "All", onChange }) {
  return (
    <div className={styles.filterList}>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`${styles.filterButton} ${
            selected === category ? styles.active : ""
          }`}
          onClick={() => onChange?.(category)}
          aria-pressed={selected === category}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
