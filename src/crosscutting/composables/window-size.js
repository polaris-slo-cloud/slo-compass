import { ref, onMounted, onUnmounted } from 'vue';

export default function useWindowSize() {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);

  function onResize() {
    height.value = window.innerHeight;
    width.value = window.innerWidth;
  }
  onMounted(() => window.addEventListener('resize', onResize));
  onUnmounted(() => window.removeEventListener('resize', onResize));

  return { height, width };
}
