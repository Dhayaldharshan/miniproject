import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class CheckDharun {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = "$2a$10$8AwVLNCiLdltUf/X7n0hAufJvxtMf.s/6nTHWja./d/jKb0CfJ4Kq";

        String[] candidates = {
            "123456", "12345678", "123456789", "1234567890", "12345",
            "dharun", "Dharun", "dharun12", "dharun123", "Dharun123", "dharun@123", "Dharun@123",
            "dharun2026", "dharun26", "dharun02", "dharun01", "dharunpass", "dharunpassword",
            "Admin@123", "admin@123", "admin123", "Admin123", "admin", "Admin",
            "Coordinator@123", "coordinator@123", "coordinator123", "Coordinator123", "coordinator",
            "Citizen@123", "citizen@123", "citizen123", "Citizen123", "citizen", "Citizen",
            "Public@123", "public@123", "public123", "Public123", "public", "Public",
            "password", "Password", "Password@123", "password123", "Password123", "Pass@123", "pass123",
            "qwerty", "qwertyuiop", "welcome", "Welcome@123", "welcome123",
            "user123", "User@123", "user@123", "test1234", "test@123", "Test@123",
            "dharun@gmail.com", "dharun@", "dharun_123", "Dharun_123"
        };

        boolean found = false;
        for (String c : candidates) {
            if (encoder.matches(c, hash)) {
                System.out.println(">>> MATCH FOUND! Password is: \"" + c + "\" (length=" + c.length() + ")");
                found = true;
                break;
            }
        }
        if (!found) {
            System.out.println(">>> NO MATCH in initial candidate list.");
        }
    }
}

