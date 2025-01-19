import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { supabase } from "../lib/supabaseClient";

const ProtectedRoute = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            const { data } = await supabase.auth.getSession();
            setUser(data?.session?.user || null);
            setLoading(false);

            // Set up auth state listener
            const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
                setUser(session?.user || null);
            });

            return () => {
                if (authListener?.subscription) {
                    authListener.subscription.unsubscribe();
                }
            };
        };

        fetchSession();
    }, []);

    if (loading) {
        return (
            <div>
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
