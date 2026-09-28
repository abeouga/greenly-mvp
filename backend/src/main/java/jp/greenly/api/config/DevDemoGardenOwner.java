package jp.greenly.api.config;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DevDemoGardenOwner implements GardenOwner {
  @Override
  public String ownerId() {
    return "greenly-local-demo";
  }
}
