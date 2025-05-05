export default defineNuxtPlugin({
  name: "theme",
  enforce: "pre",
  setup() {
    const { setTheme } = useTheme();

    // Just sync the state with what's already been set
    const currentTheme =
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "default"
        : "default");

    setTheme(currentTheme);
  },
});
