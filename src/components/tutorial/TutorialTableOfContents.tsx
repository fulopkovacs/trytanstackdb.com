import { ExternalLinkIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { deepDiveArticles, tutorialArticles } from "@/data/tutorial";

type TutorialTableOfContentsProps = {
  activeStep: string | null;
  onStepChange: (stepTitle: string) => void;
};

const sections = [
  {
    sectionTitle: "Tutorial",
    articles: tutorialArticles,
  },
  {
    sectionTitle: "Deep Dive Articles",
    articles: deepDiveArticles,
  },
];

export function TutorialTableOfContents({
  activeStep,
  onStepChange,
}: TutorialTableOfContentsProps) {
  return (
    <div className="w-48 shrink-0">
      <div className="px-2 py-2 mb-2">
        <a
          href="https://tanstack.com/db/latest"
          target="_blank"
          rel="noreferrer"
          className="text-foreground font-bold flex items-center text-sm hover:text-primary transition-colors"
        >
          Official docs <ExternalLinkIcon className="h-4 ml-1" />
        </a>
      </div>

      {sections.map(({ sectionTitle, articles }) => (
        <SidebarGroup key={sectionTitle} className="px-0 py-1">
          <SidebarGroupLabel className="text-foreground font-bold text-sm px-2">
            {sectionTitle}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuSub className="border-l-muted-foreground/30">
                  {articles.map((step) => (
                    <SidebarMenuSubItem key={step.title}>
                      <SidebarMenuSubButton
                        isActive={activeStep === step.title}
                        onClick={() => onStepChange(step.title)}
                        className="cursor-pointer text-muted-foreground hover:text-foreground data-[active=true]:bg-secondary data-[active=true]:text-primary-foreground h-fit"
                      >
                        {step.title}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  );
}
