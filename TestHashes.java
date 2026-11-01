import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestHashes {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String dhanushHash = "$2a$10$x1vw.PrhElKw03YYgpcCLe.0I3mWepXaF2O2zzT7GYRo8.dEhl8TK";
        String dharshiniHash = "$2a$10$x/KC1sKISExD6EKl/PAbf.MvbodU.9rQWzmfOPByKHFdhiGbPeCKe";
        
        String[] candidates = {
            "123456", "12345678", "123456789", "1234567890", "123456789012",
            "password", "password123", "Password@123",
            "dhanush", "dhanush12", "dhanush123", "dhanush@123", "Dhanush@123", "Dhanush123", "Dhanush@1234", "dhanush@1234",
            "dhanush2026", "Dhanush2026", "dhanush@2026", "Dhanush@2026",
            "dharshini", "dharshini123", "dharshini@123", "Dharshini@123", "Dharshini123",
            "Dharshini@12", "dharshini@12", "DharshiniV@12", "Dharshini@2026",
            "Admin@123", "admin123", "admin", "Coordinator@123", "coordinator123", "coordinator", "Coord@123",
            "COORDINATOR@123", "COORD@123", "Sarah@2026", "Test@123", "Coordinator!",
            "Coordinator1", "Coordinator@"
        };
        
        System.out.println("Testing candidates against dhanushHash...");
        boolean dhanushFound = false;
        for (String c : candidates) {
            if (encoder.matches(c, dhanushHash)) {
                System.out.println(">>> MATCH FOR dhanushHash: \"" + c + "\" (length: " + c.length() + ")");
                dhanushFound = true;
            }
        }
        if (!dhanushFound) System.out.println("No match in candidate list for dhanushHash.");
        
        System.out.println("\nTesting candidates against dharshiniHash...");
        boolean dharshiniFound = false;
        for (String c : candidates) {
            if (encoder.matches(c, dharshiniHash)) {
                System.out.println(">>> MATCH FOR dharshiniHash: \"" + c + "\" (length: " + c.length() + ")");
                dharshiniFound = true;
            }
        }
        if (!dharshiniFound) System.out.println("No match in candidate list for dharshiniHash.");
    }
}
