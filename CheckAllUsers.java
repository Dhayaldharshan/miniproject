import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.sql.*;
import java.util.*;

public class CheckAllUsers {
    public static void main(String[] args) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/resq_allocate", "root", "");
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT id, email, full_name, role, password_hash FROM users ORDER BY role, email");

        String[] testPass = {
            "Admin@123", "Coordinator@123", "Citizen@123", "123456", "password", "Password@123", "admin", "coordinator", "public"
        };

        System.out.printf("%-15s | %-32s | %-12s | %s%n", "ID", "EMAIL", "ROLE", "VERIFIED PASSWORD");
        System.out.println("----------------+----------------------------------+--------------+--------------------");

        while (rs.next()) {
            String id = rs.getString("id");
            String email = rs.getString("email");
            String role = rs.getString("role");
            String hash = rs.getString("password_hash");

            String found = "UNKNOWN";
            for (String p : testPass) {
                if (encoder.matches(p, hash)) {
                    found = p;
                    break;
                }
            }
            System.out.printf("%-15s | %-32s | %-12s | %s%n", id, email, role, found);
        }
        conn.close();
    }
}

