export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("http://localhost:5001/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return data.imageUrl;
};