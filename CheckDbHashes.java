import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class CheckDbHashes {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // Actual hashes from database:
        String adminHash = "$2a$10$v..9K678a8ltMjb14Yohp.kA7WVjwPGoGLlSvNtByrDdP/ntXUvCW";
        String coordHash = "$2a$10$rgbFGU9rlb4hCkyGpEmGpOesuzUMgJoVLaYpsciay6j/y5n9lWPA2";
        String publicHash = "$2a$10$VaTqhoJYqcf/4hZSqT2UYe/bxZJoJT7OT3C0/KhNBGIh1yucD4X0C";
        String dharshHash = "$2a$10$qEsdjRvlNdu4AdbLuB33dujuNMTAcvA6EqunKFnI9NZIn/P.ojpKu";
        String dharshiniHash = "$2a$10$x/KC1sKISExD6EKl/PAbf.MvbodU.9rQWzmfOPByKHFdhiGbPeCKe";

        String[] candidates = {
            "Admin@123", "admin@123", "admin", "admin123", "Admin123", "AdminPass@123",
            "password", "Password@123", "123456", "12345678",
            "Coordinator@123", "coordinator@123", "coordinator", "Coordinator",
            "Citizen@123", "citizen@123", "citizen", "public",
            "dharsh", "dharsh123", "Dharsh@123", "Dharsh123",
            "dharshini", "dharshini123", "Dharshini@123", "Dharshini123",
            "ResQ@123", "resq@123", "resq", "resq123"
        };

        check("usr-admin-01 (admin@crisis-sync.gov)", adminHash, candidates, encoder);
        check("usr-coord-01 (coordinator@crisis-sync.gov)", coordHash, candidates, encoder);
        check("usr-public-01 (citizen@crisis-sync.gov)", publicHash, candidates, encoder);
        check("usr-cf8b2067 (dharsh@gmail.com)", dharshHash, candidates, encoder);
        check("usr-12bee073 (dharshinivenkatesan02@gmail.com)", dharshiniHash, candidates, encoder);
    }

    private static void check(String account, String hash, String[] candidates, BCryptPasswordEncoder encoder) {
        System.out.println("Checking " + account + ":");
        boolean found = false;
        for (String c : candidates) {
            if (encoder.matches(c, hash)) {
                System.out.println("  ==> MATCH: \"" + c + "\"");
                found = true;
            }
        }
        if (!found) {
            System.out.println("  ==> NO MATCH in candidate list.");
        }
    }
}
