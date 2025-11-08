import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, AtSign, Edit2, Check, X, Loader2, Info } from "lucide-react";
import toast from "react-hot-toast";

// Helper function to calculate cooldown
const getCooldown = (lastChangedDate) => {
    if (!lastChangedDate) {
        return { canChange: true, daysLeft: 0 };
    }
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const lastChanged = new Date(lastChangedDate);
    const diff = new Date() - lastChanged;
    
    if (diff < sevenDays) {
        const timeLeft = sevenDays - diff;
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        return { canChange: false, daysLeft };
    }
    
    return { canChange: true, daysLeft: 0 };
};


const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState(authUser.username);
  
  // Get cooldown status
  const { canChange, daysLeft } = getCooldown(authUser.usernameLastUpdatedAt);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleUsernameUpdate = async () => {
    if (username.trim() === authUser.username) {
        return setIsEditingUsername(false);
    }
    if (username.trim().length < 3) {
        return toast.error("Username must be at least 3 characters");
    }
    if (username.includes(" ")) {
        return toast.error("Username cannot contain spaces");
    }

    await updateProfile({ username });
    setIsEditingUsername(false);
  };

  return (
    <div className="pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            {/* Full Name */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fullName}</p>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <AtSign className="w-4 h-4" />
                Username
              </div>
              
              {isEditingUsername ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isUpdatingProfile}
                  />
                  <button className="btn btn-success btn-circle" onClick={handleUsernameUpdate} disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? <Loader2 className="animate-spin" /> : <Check />}
                  </button>
                  <button className="btn btn-ghost btn-circle" onClick={() => setIsEditingUsername(false)} disabled={isUpdatingProfile}>
                    <X />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-1">{authUser?.username}</p>
                  <button 
                    className="btn btn-ghost btn-circle" 
                    onClick={() => setIsEditingUsername(true)}
                    disabled={!canChange || isUpdatingProfile}
                    title={canChange ? "Edit username" : `On cooldown`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Cooldown Message */}
              {!canChange && daysLeft > 0 && (
                 <div className="text-xs text-info flex items-center gap-1 p-1">
                    <Info className="size-3" />
                    You can change your username again in {daysLeft} day(s).
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;