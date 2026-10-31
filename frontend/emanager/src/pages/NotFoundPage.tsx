import { useNavigate } from "react-router-dom"
export function NotFoundPage()
{
    const navigate = useNavigate();
    const pressed = () => {navigate("/dashboard")};
    return (
    <div className="w-full h-screen bg-gray-700 flex items-center justify-center">
        
        <div className="flex flex-col items-center gap-2">
            <label className="text-white"> Not found. </label>
            <button className="w-20 bg-gray-300 hover:bg-gray-600 transition-colors rounded p-1" onClick={pressed}> Go to Home Page </button>
        </div>
    </div>
    )
}