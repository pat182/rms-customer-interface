import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LandingData } from "../types/landingTypes";

export default function MenuScreen(){
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [landingData, setLandingData] = useState<LandingData | null>(null);
    const categoriesRef = useRef<HTMLDivElement>(null);
    
    

    return {
        loading,
        setLoading,
        error,
        setError,
        landingData,
        setLandingData,
        categoriesRef,
    }
}

