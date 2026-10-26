export function createImages(ctx){
  function openImagePicker(){
    ctx.imageInput?.click();
  }

  function readImage(file){
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => addImage(reader.result);
    reader.readAsDataURL(file);
  }

  function imageFit(width, height){
    const scale = Math.min(ctx.canvasWidth / width, ctx.canvasHeight / height);
    const fitWidth = ctx.round2(width * scale);
    const fitHeight = ctx.round2(height * scale);
    return { x: ctx.round2((ctx.canvasWidth - fitWidth) / 2), y: ctx.round2((ctx.canvasHeight - fitHeight) / 2), width: fitWidth, height: fitHeight };
  }

  function addImage(source){
    const probe = new Image();
    probe.onload = () => {
      const imageId = `image_${ctx.nextId++}`;
      ctx.imageSources = { ...ctx.imageSources, [imageId]: source };
      const shape = { id: ctx.nextId++, kind: "image", imageId, ...imageFit(probe.naturalWidth, probe.naturalHeight), opacity: 0.5 };
      ctx.shapes.push(shape);
      if (ctx.tool !== "select") ctx.pickTool("select");
      ctx.selectShape(shape.id);
    };
    probe.src = source;
  }

  function fitImage(){
    const image = ctx.selectedShape?.kind === "image" ? ctx.selectedShape : null;
    if (image) Object.assign(image, imageFit(image.width, image.height));
  }

  function setImageOpacity(value){
    if (ctx.selectedShape?.kind !== "image") return;
    ctx.editKey = "opacity";
    ctx.selectedShape.opacity = value;
  }

  return { openImagePicker, readImage, imageFit, addImage, fitImage, setImageOpacity };
}
