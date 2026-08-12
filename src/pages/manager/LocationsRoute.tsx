import { useAuth } from '../../context/AuthContext';
import LocationManagement from './LocationManagement';
import MyLocationPage from './MyLocationPage';

export default function LocationsRoute() {
  const { user } = useAuth();
  return user?.role === 'location_manager' ? <MyLocationPage /> : <LocationManagement />;
}
