 "use client";

 import { useState } from "react";
 import { useRouter } from "next/navigation";
 import { createClient } from "@/lib/supabase/client";

 type ProfileFormProps = {
   userId: string;
   firstName: string | null;
   lastName: string | null;
   avatarUrl: string | null;
 };

 export default function ProfileForm({
   userId,
   firstName,
   lastName,
   avatarUrl,
 }: ProfileFormProps) {
   const [first, setFirst] = useState(firstName ?? "");
   const [last, setLast] = useState(lastName ?? "");
   const [avatar, setAvatar] = useState(avatarUrl);
   const [message, setMessage] = useState("");

   const router = useRouter();

   async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
     event.preventDefault();

     setMessage("");

     const supabase = createClient();

     const { error } = await supabase
       .from("profiles")
       .update({
         first_name: first,
         last_name: last,
       })
       .eq("id", userId);

     if (error) {
       setMessage("Failed to update profile.");
       return;
     }

     setMessage("Profile updated!");
     router.refresh();
   }

   async function handleAvatarUpload(
     event: React.ChangeEvent<HTMLInputElement>
   ) {
     const file = event.target.files?.[0];

     if (!file) {
       return;
     }

     setMessage("Uploading photo...");

     const supabase = createClient();

     // 每次上传生成一个新的文件名
     const fileExtension = file.name.split(".").pop();
     const filePath = `${userId}/${Date.now()}.${fileExtension}`;

     // 把真实图片上传到 Supabase Storage
     const { error: uploadError } = await supabase.storage
       .from("avatars")
       .upload(filePath, file);

     if (uploadError) {
       setMessage("Failed to upload photo.");
       return;
     }

     // 获取 public URL
     const {
       data: { publicUrl },
     } = supabase.storage
       .from("avatars")
       .getPublicUrl(filePath);

     // 数据库里只保存 URL，不保存图片 binary
     const { error: profileError } = await supabase
       .from("profiles")
       .update({
         avatar_url: publicUrl,
       })
       .eq("id", userId);

     if (profileError) {
       setMessage("Photo uploaded, but profile could not be updated.");
       return;
     }

     setAvatar(publicUrl);
     setMessage("Profile photo updated!");
     router.refresh();
   }

   return (
     <div className="mt-6 max-w-md">
       <div className="mb-6">
         <h2 className="mb-2 font-medium">Profile Photo</h2>

         {avatar && (
           <img
             src={avatar}
             alt="Profile"
             className="mb-3 h-24 w-24 rounded-full object-cover"
           />
         )}

         <input
           type="file"
           accept="image/jpeg,image/png,image/webp"
           onChange={handleAvatarUpload}
         />
       </div>

       <form onSubmit={handleSubmit} className="space-y-4">
         <div>
           <label className="block font-medium">
             First Name
           </label>

           <input
             type="text"
             value={first}
             onChange={(event) => setFirst(event.target.value)}
             className="mt-1 w-full rounded border p-2"
             required
           />
         </div>

         <div>
           <label className="block font-medium">
             Last Name
           </label>

           <input
             type="text"
             value={last}
             onChange={(event) => setLast(event.target.value)}
             className="mt-1 w-full rounded border p-2"
             required
           />
         </div>

         <button
           type="submit"
           className="rounded bg-black px-4 py-2 text-white"
         >
           Save Profile
         </button>

         {message && <p>{message}</p>}
       </form>
     </div>
   );
 }