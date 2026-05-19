const prevProps = { isDraggable: false };
const nextProps = { isDraggable: true };
const draggableUnchanged = prevProps.isDraggable === nextProps.isDraggable;
console.log({ draggableUnchanged });
