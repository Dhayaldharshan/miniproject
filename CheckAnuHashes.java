import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class CheckAnuHashes {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash1 = "$2a$10$o7BdTBy3MFZbAChf6xwDfe0Y/Cr5/MQSuyvpRzQf6cKHiNZif4oiG";
        String hash2 = "$2a$10$/jqe68V3GrkibfZKF1QTYuNVILvw6SvaS2.a9dh67jzQ3LH3Nrija";

        String[] candidates = {
            "123456", "12345678", "password", "Password@123", "anu", "anu123", "Anu@123", "Anu123",
            "anus", "anus123", "Anus@123", "Anus123", "Citizen@123", "citizen@123", "public", "Public@123",
            "123456789", "admin", "Admin@123"
        };

        for (String c : candidates) {
            if (encoder.matches(c, hash1)) {
                System.out.println("anu@gmail.com matches: " + c);
            }
            if (encoder.matches(c, hash2)) {
                System.out.println("anus@gmail.com matches: " + c);
            }
        }
    }
}

